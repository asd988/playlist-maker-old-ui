console.log("Hello world!")

const stateKey = 'spotify_auth_state';
const clientId = 'fd19eb51d7204c3f9096c4751e6c14fd';
const redirectUri = (window.location.host === "localhost:8888") ? "http://localhost:8888/callback" : "https://asd988.github.io/callback"

const listMemberHtml = 
`<div class="list-member">
    <input type="checkbox" class="member-selection">
    <div class="member-info">
        <text class="title">$</text>
        <text class="author desc">$</text>
        <text class="info desc">$ songs</text>
    </div>
</div>`


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
    const list = document.getElementById("list")

    // get items from spotify
    let { items } = await (await fetch("https://api.spotify.com/v1/me/playlists", {headers:{'Authorization': 'Bearer ' + access_token}})).json();

    // place each in list
    items.forEach( ({ name, owner, tracks }) => {
        list.appendChild(
            document.createRange().createContextualFragment(
                listMemberHtml.fillOut("$", name, owner.display_name, tracks.total)
                )
            );
    })
}



load()