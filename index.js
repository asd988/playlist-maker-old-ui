console.log("Hello world!")

const stateKey = 'spotify_auth_state';
const clientId = 'fd19eb51d7204c3f9096c4751e6c14fd';
const redirectUri = (window.location.host === "localhost:8888") ? "http://localhost:8888/callback" : "https://asd988.github.io/callback"



let generateRandomString = function (length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function login() {
    console.log("logging in")

    const state = generateRandomString(16)
    Cookies.set(stateKey, state)

    const scope = "user-read-private user-read-email"

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
    document.getElementById("logged-in").style.display = "none"
    notLoggedIn()
}

async function load() {
    if (Cookies.get("profile") !== undefined) {
        const { access_token } = JSON.parse(Cookies.get("profile"))
        let response = await fetch("https://api.spotify.com/v1/me", {headers:{'Authorization': 'Bearer ' + access_token}});
        let data = await response.json()
        console.log(data)
        if (response.status === 200) {
            document.getElementById("logged-in").style.display = ""

            document.getElementById("name-display").textContent = data.display_name

        } else {
            notLoggedIn();
        }
    } else {
        notLoggedIn()
    }
}

function notLoggedIn() {
    document.getElementById("login-btn").style.display = ""
    Cookies.remove("profile")
}

load()