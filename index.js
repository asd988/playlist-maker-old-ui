
const stateKey = 'spotify_auth_state';
const clientId = 'fd19eb51d7204c3f9096c4751e6c14fd';
const redirectUri = (window.location.host === "localhost:8888") ? "http://localhost:8888/callback" : "https://asd988.github.io/callback"

const listMemberHtml = 
`<div class="list-member">
    <input type="checkbox" class="member-selection" value="$" $>
    <div class="member-info">
        <text class="title">$</text>
        <text class="author desc">$</text>
        <text class="info desc">$ songs</text>
    </div>
</div>`

let playlists;
let selectedIds = [];
let my_id;
let access_token;
let query = "";

function login() {
    console.log("logging in")

    const state = generateRandomString(16)
    Cookies.set(stateKey, state)

    const scope = "user-read-private user-read-email playlist-read-private user-library-read playlist-modify-private"

    // redirect
    location.href = "https://accounts.spotify.com/authorize?" + 
        new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: scope,
            redirect_uri: redirectUri,
            state: state
        }).toString();
}

function logout() {
    // hide logged in ui
    document.getElementById("logged-in").style.display = "none"
    notLoggedIn()
}

async function createPlaylist() {
    const profile = JSON.parse(Cookies.get("profile"))
    access_token = profile.access_token
    const name = document.getElementById("playlist-name").value
    const remove_previous = document.getElementById("remove-previous").checked
    const remove_duplicates = document.getElementById("remove-duplicates").checked

    const previous_id = Cookies.get("previous_id")
    Cookies.remove("previous_id")

    if (remove_previous && previous_id !== undefined) {
        fetch(`https://api.spotify.com/v1/playlists/${previous_id}/followers`, {
            headers:{'Authorization': 'Bearer ' + access_token}, 
            method: "DELETE"
        })
    }

    const response = await fetch(`https://api.spotify.com/v1/users/${my_id}/playlists`, {
        method:"POST", 
        headers:{'Authorization': 'Bearer ' + access_token}, 
        body: JSON.stringify({name: name, public:false})
    })
    const data = await response.json();
    Cookies.set("previous_id", data.id)

    const selectedPlaylists = playlists.filter(a => selectedIds.includes(a.id))
    let promises = []
    selectedPlaylists.forEach(a => promises.push(getAllTracks(a.id, a.tracks.total)))
    const results = await Promise.all(promises)
    let allTracks = [].concat.apply([], results)
    if (remove_duplicates) allTracks = removeTrackDuplicates(allTracks);

    putTracks(data.id, allTracks)
}

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

async function putTracks(playlistId, tracks) {
    const mappedTracks = tracks.map(({track}) => track.uri)
    for (let i = 0; i < tracks.length; i += 100) {
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers:{'Authorization': 'Bearer ' + access_token},
            method: "POST",
            body: JSON.stringify({
                uris: mappedTracks.slice(i, i+100)
            })
        })
    }
}

function removeTrackDuplicates(tracks) {
    let seen = {}
    return tracks.filter(({track}) => {
        return seen.hasOwnProperty(track.id) ? false : (seen[track.id] = true);
    })
}

// (to lazy to add a listener to every class member & some ppl say this is actually better)
// add event listener to every checkbox
document.body.addEventListener('change', function (evt) {
    if (evt.target.className === "member-selection") {
        checkboxChange(evt)
    }
}, false);
function checkboxChange(event) {
    const target = event.target;

    if (target.checked) {
        selectedIds.push(playlists[target.value].id)
    } else {
        selectedIds.remove(playlists[target.value].id)
    }
    console.log(selectedIds)
    update()
}


const options = document.getElementsByClassName("search-option");
for (let i = 0; i < options.length; i++) {
    options[i].addEventListener("click", optionClick)
}
function optionClick(event) {
    let target = event.target;
    if (target.localName === "text") target = target.parentNode
    if (target.className.includes("search-option")) {
        const isOpen = target.getAttribute("open") === "true";
        target.setAttribute("open", !isOpen)
        target.childNodes[5].style.display = isOpen ? "none" : "";
    }
    
}


const dp_options = document.querySelectorAll("option");
for (let i = 0; i < dp_options.length; i++) {
    dp_options[i].addEventListener("click", dpOptionSelect)
}
function dpOptionSelect(event) {
    const target = event.target

    target.parentNode.parentNode.setAttribute("value", target.value)
    target.parentNode.parentNode.childNodes[1].innerText = target.parentNode.parentNode.childNodes[1].innerText.replace(/(?<=: ).*/, target.getAttribute("display-name"))

    const children = target.parentNode.childNodes
    for (let i = 0; i < children.length; i++) {
        if (children[i].localName === "option") {
            children[i].removeAttribute("selected")
        }
    }
    target.setAttribute("selected", "")
    update()
}

const searchInput = document.getElementById("search-input")
searchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();

        query = searchInput.value
        update()
    }
});

async function load() {
    if (Cookies.get("profile") !== undefined) {
        // get access_token
        const profile = JSON.parse(Cookies.get("profile"))
        access_token = profile.access_token

        // retrieve response from spotify
        let response = await fetch("https://api.spotify.com/v1/me", {headers:{'Authorization': 'Bearer ' + access_token}});
        let data = await response.json()
        my_id = data.id;

        // if response successful then continue
        if (response.status === 200) {
            // show logged in ui
            document.getElementById("logged-in").style.display = ""
            // display username
            document.getElementById("name-display").textContent = data.display_name

            loadPlaylists()
        } else {
            notLoggedIn();
        }
    } else {
        notLoggedIn()
    }
}

function notLoggedIn() {
    // show log in ui
    document.getElementById("login-btn").style.display = ""
    Cookies.remove("profile")
}

async function loadPlaylists() {

    // get items from spotify
    let { items } = await (await fetch("https://api.spotify.com/v1/me/playlists", {headers:{'Authorization': 'Bearer ' + access_token}})).json();
    playlists = items;
    playlists.map((a, i) => a.internalId = i);

    update(playlists)
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


load()