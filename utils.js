function generateRandomString(length) {
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
Array.prototype.remove = function (item) {
    var index = this.indexOf(item);
    if (index !== -1) {
        this.splice(index, 1);
    }
}