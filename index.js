
let playlists;
let selectedIds = [];
let my_id;
let access_token;
let query = "";

// runs on load
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
            loggedIn(data.display_name)
        } else {
            notLoggedIn();
        }
    } else {
        notLoggedIn()
    }
}

async function createPlaylist() {
    const profile = JSON.parse(Cookies.get("profile"))
    access_token = profile.access_token
    const name = document.getElementById("playlist-name").value
    const order = document.getElementById("playlist-order").value
    const remove_previous = document.getElementById("remove-previous").checked
    const remove_duplicates = document.getElementById("remove-duplicates").checked

    let id = Cookies.get("previous_id")

    if (remove_previous && id !== undefined) {
        const previousTracks = await getAllTracks(
            id, 
            playlists.filter(a => a.id === id)[0].tracks.total
        );
        await removeTracks(id, previousTracks.map(a => a.track.uri))
    } else {
        const response = await fetch(`https://api.spotify.com/v1/users/${my_id}/playlists`, {
            method:"POST", 
            headers:{'Authorization': 'Bearer ' + access_token}, 
            body: JSON.stringify({name: name, public:false})
        })
        const data = await response.json();
        Cookies.set("previous_id", data.id)
        id = data.id;
    }

    
    

    const selectedPlaylists = playlists.filter(a => selectedIds.includes(a.id))
    let promises = []
    selectedPlaylists.forEach(a => promises.push(getAllTracks(a.id, a.tracks.total)))
    const results = await Promise.all(promises)
    let allTracks = [].concat.apply([], results)
    if (remove_duplicates) allTracks = removeTrackDuplicates(allTracks);


    let trackUris = allTracks.map(({track}) => track.uri)
    if (order === "random") trackUris = shuffleArray(trackUris);
    await putTracks(id, trackUris)
    //await delay(100)
    loadPlaylists()
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
    update()
}

// search options
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

// dropdown options
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

function notLoggedIn() {
    // show log in ui
    document.getElementById("login-btn").style.display = ""
    Cookies.remove("profile")
}

function loggedIn(name) {
    // show logged in ui
    document.getElementById("logged-in").style.display = ""
    // display username
    document.getElementById("name-display").textContent = name

    loadPlaylists()
}

load()