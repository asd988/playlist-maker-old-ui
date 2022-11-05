const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

const stateKey = 'spotify_auth_state';

let code = params.code || null;
let state = params.state || null;
let storedState = Cookies.get(stateKey) || null;

if (state === null || state !== storedState) {
    console.log("error")
} else {
    Cookies.remove(stateKey)

    const data = {
        state: state,
        code: code,
        is_localhost: window.location.host === "localhost:8888"
    }

    fetch("https://spotify-playlist.asd988.workers.dev/callback", {
            method: "POST", 
            body: JSON.stringify(data)
        })
        .then(r => r.json()).then(a => {
            Cookies.set("profile", JSON.stringify(a))
            document.location.href="/";
        })
}
