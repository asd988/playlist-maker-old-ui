
const listMemberHtml = 
`<div class="list-member">
    <input type="checkbox" class="member-selection" value="$" $>
    <div class="member-info">
        <text class="title">$</text>
        <text class="author desc">$</text>
        <text class="info desc">$ songs</text>
    </div>
</div>`

async function getAllTracks(playlistId, total) {
    let offset = 0;
    let promises = []
    while (offset < total) {
        promises.push( fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?` + new URLSearchParams({
            offset: offset
        }), {
            headers:{'Authorization': 'Bearer ' + access_token},
            method: "GET"
        }) )
        offset += 100;
    }
    const responses = await Promise.all(promises)
    const datas = await Promise.all(responses.map( a => a.json()))
    let allItems = [];
    datas.forEach( a => allItems = allItems.concat(a.items));
    return allItems
}

async function removeTracks(playlistId, trackUris) {
    for (let i = 0; i < trackUris.length; i += 100) {
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers:{'Authorization': 'Bearer ' + access_token},
            method: "DELETE",
            body: JSON.stringify({
                uris: trackUris.slice(i, i+100)
            })
        })
    }
}

async function putTracks(playlistId, trackUris) {
    let promises = []
    for (let i = 0; i < trackUris.length; i += 100) {
        promises.push( fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers:{'Authorization': 'Bearer ' + access_token},
            method: "POST",
            body: JSON.stringify({
                uris: trackUris.slice(i, i+100)
            })
        }) )
    }
    return await Promise.all(promises)
}

function removeTrackDuplicates(tracks) {
    let seen = {}
    return tracks.filter(({track}) => {
        return seen.hasOwnProperty(track.id) ? false : (seen[track.id] = true);
    })
}

async function loadPlaylists() {

    // get items from spotify
    let { items } = await (await fetch("https://api.spotify.com/v1/me/playlists", {headers:{'Authorization': 'Bearer ' + access_token}})).json();
    playlists = items;
    playlists.map((a, i) => a.internalId = i);

    update(playlists)
}

function update() {
    const simpleQuery = query.toLocaleLowerCase().replaceAll(" ", "")
    const filter = document.getElementById("filter-by-selection").getAttribute("value")
    const sort = document.getElementById("sorting").getAttribute("value")
    
    // clone playlists because some wierd referencing will take place
    let filteredLists = JSON.parse(JSON.stringify(playlists))
    filteredLists = filteredLists.sort((a, b) => {
        a = a.name;
        b = b.name;
        if (sort === "a-z") {
            return a.localeCompare(b);
        } else if (sort === "z-a") {
            return b.localeCompare(a);
        } else if (sort === "latest") {
            
        }
        return 0
    }).filter(({name, id}) => {
        const selected = selectedIds.includes(id);
        const simpleName = name.toLocaleLowerCase().replaceAll(" ", "")
        
        let allow = true;
        if (filter === "selected") {
            allow = selected;
        } else if (filter === "unselected") {
            allow = !selected
        }
        
        return (simpleName.includes(simpleQuery) || simpleQuery.includes(simpleName)) && allow;
    })
    displayPlaylists(filteredLists);
}

function displayPlaylists(pl) {
    const list = document.getElementById("list")

    // empty first
    list.innerHTML = "";
    // place each in list
    pl.forEach( ({ name, owner, tracks, id, internalId }) => {
        const selected = selectedIds.includes(id);
        list.appendChild(
            document.createRange().createContextualFragment(
                listMemberHtml.fillOut("$", internalId, selected ? "checked" : "", name, owner.display_name, tracks.total)
                )
            );
    })
}
