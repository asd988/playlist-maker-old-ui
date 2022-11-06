
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

let query = "";

let generateRandomString = function (length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// replaces a certain string with others...
String.prototype.fillOut = function (what, ...to) {
    let array = this.split(what);
    to.forEach((a, i) => {
        array.splice(2*i+1, 0, a);
    })
    return array.join("");
}

function login() {
    console.log("logging in")

    const state = generateRandomString(16)
    Cookies.set(stateKey, state)

    const scope = "user-read-private user-read-email playlist-read-private user-library-read"

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

// (to lazy to add a listener to every class member & some ppl say this is actually better)
// add event listener to every checkbox
document.body.addEventListener('change', function (evt) {
    if (evt.target.className === "member-selection") {
        checkboxChange(evt)
    }
}, false);
function checkboxChange(event) {
    const target = event.target;

    playlists[target.value].selected = target.checked
    console.log(playlists.filter( a => a.selected))
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
        // get access token
        const { access_token } = JSON.parse(Cookies.get("profile"))

        // retrieve response from spotify
        let response = await fetch("https://api.spotify.com/v1/me", {headers:{'Authorization': 'Bearer ' + access_token}});
        let data = await response.json()
        
        // if response successful then continue
        if (response.status === 200) {
            // show logged in ui
            document.getElementById("logged-in").style.display = ""
            // display username
            document.getElementById("name-display").textContent = data.display_name

            loadPlaylists(access_token)
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

async function loadPlaylists(access_token) {

    // get items from spotify
    let { items } = await (await fetch("https://api.spotify.com/v1/me/playlists", {headers:{'Authorization': 'Bearer ' + access_token}})).json();
    playlists = items;
    playlists.map((a, i) => {a.internalId = i; a.selected = false});

    displayPlaylists(playlists)
}

function displayPlaylists(pl) {
    const list = document.getElementById("list")

    // empty first
    list.innerHTML = "";
    // place each in list
    pl.forEach( ({ name, owner, tracks, internalId, selected }) => {
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
    }).filter(({name, selected}) => {
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