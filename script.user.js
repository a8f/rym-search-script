// ==UserScript==
// @name     RYM Add Search To Collection
// @description Adds "Add to collection" button to RateYourMusic search results. NOTE: "Add to collection" is shown even if the item is already in your collection. In this case, clicking it will be a noop, however after clicking it the "Remove from collection" will work correctly.
// @namespace airstrafe.net
// @version  0.1
// @include  /^https?://rateyourmusic\.com/search?.*/
// @grant       GM_cookie
// @grant       GM.cookie
// ==/UserScript==


/*** Set this if your userscript manager doesn't support GM.cookie.
You will need to manually update it when session expires ***/
let AUTH_TOKEN = "";

const $ = unsafeWindow.jQuery;
const SET_OWNERSHIP_URL = "https://rateyourmusic.com/httprequest/CatalogSetOwnership";
main();

async function main() {
    $(".infobox").each(injectResultContent);
    GM.cookie.list({
        name: "ulv"
    }).then((cookies) => {
        console.log(AUTH_TOKEN);
        if (cookies && cookies[0] && cookies[0].value) {
            AUTH_TOKEN = cookies[0].value;
        }
        if (!AUTH_TOKEN) {
            warnMissingGmCookie();
        }
    });
}

function setOwnership(assoc_id, type, ownership) {
    $.ajax(SET_OWNERSHIP_URL, {
        method: "POST",
        withCredentials: true,
        data: {
            type,
            assoc_id,
            ownership,
            request_token: decodeURIComponent(AUTH_TOKEN),
            rym_ajax_req: 1,
            action: "CatalogSetOwnership"
        }
    });
}


// inject content for a single search result
function injectResultContent(_, row) {
    const td = $(row).find("tbody").find("td");
    if (!td || td.length < 2) {
        return;
    }

    // create container for button
    const container = $(td[1]);
    $(container).clone().appendTo($(td[0].parentElement));
    container.empty();
    // get info for request
    let a = $(td[0]).find("a");
    if (a && a.length > 1) {
        a = $(a.get(1)); // release
    }
    const title = a.attr("title"); // form "[FilmXXXX]"
    const type = title.startsWith("[Film") ? "F" : "l";
    const id = Number(title.match(/\d+/));

    // create button
    const addCollectionButton = $("<button>Add to collection</button>");
    addCollectionButton.on("click", () => onClickAddToCollection(addCollectionButton, id, type));
    container.append(addCollectionButton);

}

function onClickAddToCollection(button, assoc_id, type) {
    const adding = button.text().startsWith("Add");
    button.text(adding ? "Remove from collection" : "Add to collection");
    setOwnership(assoc_id, type, adding ? "o" : "n");
}

function warnMissingGmCookie() {
    $(".page_search_results").prepend($("<div>Warning: Your userscript manager doesn't support GM.cookie.<b> Add to collection will not work!</b> Use a different userscript manager (e.g. Tampermonkey Beta) or set AUTH_TOKEN in the userscript source code.</div>"));
}
