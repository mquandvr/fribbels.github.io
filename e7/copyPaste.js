HERO_CACHE = "https://e7-optimizer-game-data.s3-accelerate.amazonaws.com/herodata.json?";
heroData = {};
oathMode = false;
$ = jQuery


loadedHeroData = false;
loadedGwdb = false;

selector0 = null
selector1 = null
selector2 = null
selector3 = null
selector4 = null

jQuery(document).ready(function($){
    document.title = "Fribbels GW Meta Tracker"
    $("#homeLink").attr("href", window.location.href.split('?')[0])

    $(document).ready(async () => {
        var options = {
            sortField: 'text',
            width: 'resolve', // need to override the changed default
            placeholder: "Select hero",
            templateResult: formatHeroList,
            theme: "classic"
        }
        var includeOptions = {
            sortField: 'text',
            width: 'resolve', // need to override the changed default
            placeholder: "Include hero",
            templateResult: formatHeroList,
            theme: "classic",
            allowClear: true
        }
        var excludeOptions = {
            sortField: 'text',
            width: 'resolve', // need to override the changed default
            placeholder: "Exclude hero",
            templateResult: formatHeroList,
            theme: "classic",
            allowClear: true
        }

        selector0 = $('#heroSelector0').select2(options);
        selector1 = $('#heroSelector1').select2(options);
        selector2 = $('#heroSelector2').select2(options);
        selector3 = $('#heroSelector3').select2(includeOptions);
        selector4 = $('#heroSelector4').select2(excludeOptions);
    });

    $("#searchButton").click(search)

    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString).get('def');

    if (urlParams) {
        $('#resultRows').html("Loading..")
    } else {
        $('#metaRows').html("Loading...")
    }

    fetchCache(HERO_CACHE).then(x => {
        console.log("herodata", x)
        heroData = x;

        var oathUrlParams = new URLSearchParams(queryString).get('oath');

        if (oathUrlParams) {
            oathMode = true;
        }

        for (var value of Object.values(heroData)) {
            var img=new Image();
            img.src=value.assets.icon;
        }

        try {
            if (urlParams) {
                var names = urlParams.split(",")
                var ids = names.map(x => Object.entries(heroesById).find(y => y[1] == x)[0])

                selector0.val(ids[0]).trigger("change");
                selector1.val(ids[1]).trigger("change");
                selector2.val(ids[2]).trigger("change");

                search();
            }
        } catch (e) {
            console.error("Url parsing failed", e);
        }

        loadedHeroData = true;
        checkReady();
    })

    var entries = Object.entries(heroesById).sort(function compare(a, b) {
        if (a[1] < b[1])
            return -1;
        if (a[1] > b[1])
            return 1;
        return 0;
    })

    for (var entry of entries) {
        var data = {
            id: entry[0],
            text: entry[1]
        };

        var newOption0 = new Option(data.text, data.id, false, false);
        var newOption1 = new Option(data.text, data.id, false, false);
        var newOption2 = new Option(data.text, data.id, false, false);
        var newOption3 = new Option(data.text, data.id, false, false);
        var newOption4 = new Option(data.text, data.id, false, false);
        $('#heroSelector0').append(newOption0);
        $('#heroSelector1').append(newOption1);
        $('#heroSelector2').append(newOption2);
        $('#heroSelector3').append(newOption3);
        $('#heroSelector4').append(newOption4);
    }
});

function checkReady() {
    if (!loadedHeroData) {
        return;
    }

    showMeta()
}

function showMeta() {
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString).get('def');

    $.ajax({
        url: "https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getMeta",
        // url: "http://127.0.0.1:5000/getMeta",
        //force to handle it as text
        dataType: "text",
        type: "POST",
        crossDomain: true,
        data: "none",
        success: function(data) {
            var json = $.parseJSON(data);
            console.log("meta", json)
            var defenses = json.data
            var offenses = Object.entries(json.offenseData)
            var totalSize = json.totalSize

            $('#intro').html(`This app tracks data from ${totalSize.toLocaleString("en-US")} attacks from top 30 ranked guild war matchups.`)

            if (urlParams) {
                return;
            }

            defenses.sort((a, b) => (b.w+b.l) - (a.w+a.l))
            offenses.sort((a, b) => (b[1].w+b[1].l) - (a[1].w+a[1].l))

            var html = "</br></br><h2>Top 30 most common meta defenses in past 3 weeks</h2>";
            for (var i = 0; i < 30; i++) {
                var defense = defenses[i];
                var percent = (defense.w/(defense.l + defense.w + defense.d) * 100).toFixed(1);

                html +=
`
<div class="resultRow">
    <div class="imageRow">
            <a href="${"gw-meta.html?def=" + defense.defense.split(",").map(x => heroesById[x]).join(",")}">
            <div class="metaFightIcons">
                ${imgHtml(defense.defense)}
                <div class="vSpace"></div>
            </div>
            </a>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${defense.w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_def.png"></img>

            <div class="metaResults L">
                ${defense.l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_defeat.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "No results" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`
            }

            html += "</br></br><h2>Top 30 most common meta offense units in past 3 weeks</h2>"

            for (var i = 0; i < 30; i++) {
                var offenseName = offenses[i][0];
                var offenseWL = offenses[i][1];
                var percent = (offenseWL.w/(offenseWL.l + offenseWL.w) * 100).toFixed(1);
                console.log(percent)
                console.log(offenseWL)
                html +=
`
<div class="resultRow">
    <div class="imageRow">
            <div class="metaFightIconsOffense">
                ${imgHtml(offenseName)}
                <div class="vSpace"></div>
            </div>
            </a>
        <div class="resultsContainer">
            <div class="metaResults W">
                ${offenseWL.w}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_win.png"></img>

            <div class="metaResults L">
                ${offenseWL.l}
            </div>
            <img class="metaAtkImg" src="battle_pvp_icon_lose.png"></img>

            <div class="metaResultsPercent">
                ${isNaN(percent) ? "No results" : percent + " %"}
            </div>
        </div>
    </div>
</div>
`

            }

            $('#metaRows').html(html)
        }
    })
}

function formatHeroList(hero) {
    if (!hero.id) {
        return hero.text
    }
    var output = $(`<div class="searchRowContainer"><img src="${heroData[hero.text].assets.icon}" class="heroSearchIcon" />${hero.text}</div>`);

    return output;
};

function search() {
    heroes = [
        $('#heroSelector0').select2('data')[0],
        $('#heroSelector1').select2('data')[0],
        $('#heroSelector2').select2('data')[0]
    ]
    var defenseKey = heroes.map(x => x.id).sort()
    console.log("defkey", defenseKey);

    $('#resultRows').html("Loading..")
    var defenseHtml = imgHtml(defenseKey.join(","))
    $('#defenseIcons').html("<br/>" + defenseHtml)


    var names = defenseKey.map(x => heroesById[x]).join(",")
    window.history.replaceState(null, null, "?def=" + names + (oathMode ? "&oath=true" : ""));


    $.ajax({
        url: "https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getDef",
        //force to handle it as text
        dataType: "text",
        type: "POST",
        crossDomain: true,
        data: defenseKey.join(","),
        success: function(data) {
            //data downloaded so we call parseJSON function
            //and pass downloaded data
            var json = $.parseJSON(data);
            //now json variable contains data in json format
            //let's display a few items
            console.log("getDefResponse", json);

            offenseComps = json.data;

            if (!offenseComps) {
                $('#resultRows').html("No results")
                return
            }


            include = $('#heroSelector3').select2('data')[0].id
            exclude = $('#heroSelector4').select2('data')[0].id
            console.log("filter", include)
            console.log("exclude", exclude)
            // var offenses = {}
            // for (var fight of fights) {
            //     if (!offenses[fight.offense]) {
            //         offenses[fight.offense] = []
            //     }
            //     offenses[fight.offense].push(fight)
            // }

            // offenses = Object.keys(offenses).map(x => ({
            //     offense: x,
            //     fights: offenses[x]
            // }))

            offenses = Object.entries(offenseComps).sort(function compare(a, b) {
                if (a[1].w + a[1].l + a[1].d < b[1].w + b[1].l + b[1].d)
                    return 1;
                if (a[1].w + a[1].l + a[1].d > b[1].w + b[1].l + b[1].d)
                    return -1;
                return 0;
            }).filter(x => {
                if (include.length == 0)
                    return true
                else
                    return x[0].includes(include);
            }).filter(x => {
                if (exclude.length == 0)
                    return true
                else
                    return !x[0].includes(exclude);
            })

            $('#resultRows').html("")

            console.log("offenses", offenses)

            var html = ""

            for (var i = 0; i < Math.min(100, offenses.length); i++) {
            // for (var offense of offenses) {
                var offense = offenses[i]

                var percent = (offense[1].w/(offense[1].l + offense[1].w + offense[1].d) * 100).toFixed(1);

                html += `
        <div class="resultRow">
            <div class="imageRow">
                <div class="fightIcons">
                    ${imgHtml(defenseKey.join(","))}
                    <div class="vSpace"></div>
                    <img class="atkImg" src="battle_pvp_icon_win.png"></img>
                    <div class="vSpace"></div>
                    ${imgHtml(offense[0])}
                </div>
                <div class="resultsContainer">
                    <div class="results W">${offense[1].w}W</div>
                    <div class="results L">${offense[1].l}L</div>
                </div>
                <div class="metaResultsPercent">
                    ${isNaN(percent) ? "No results" : percent + " %"}
                </div>
            </div>
        </div>
                `
            }

                // <div class="intersText">
                //     ${inters.length && oathMode > 0 ? `Inters: ${inters.join(", ")}<div class="vSpace"></div><div class="vSpace"></div>` : ""}
                // </div>

            $('#resultRows').html(html)
            $('#metaRows').html("")
        }
    });
}

async function fetchCache(url) {
    console.log("Fetching from url: " + url);
    var myHeaders = new Headers();
    myHeaders.append('pragma', 'no-cache');
    myHeaders.append('cache-control', 'no-cache');

    const response = await fetch(url, {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors', // no-cors, *cors, same-origin
    });
    const text = await response.text();
    const json = JSON.parse(text);
    console.log("Finished fetching from url: " + url);

    return json;
}

function sortByAttribute (arr, attributeStr) {
    function compare(a, b) {
        if (a[attributeStr] < b[attributeStr])
            return -1;
        if (a[attributeStr] > b[attributeStr])
            return 1;
        return 0;
    }

    return arr.sort(compare);
}

var questionCircle = "https://raw.githubusercontent.com/fribbels/Fribbels-Epic-7-Optimizer/main/data/cachedimages/question_circle.png";
function imgHtml(offenseStr) {
    var heroIds = offenseStr.split(",")
    var heroNames = heroIds.map(x => heroesById[x])
    var imgHtml = heroNames.map(x => {
        return heroData[x] ?
        `<img class="portrait" title="${x}" src=${heroData[x].assets.icon}></img>` :
        `<img class="portrait" src=${questionCircle}></img>`
    })

    return imgHtml.join(`<div class="vSpace"></div>`)
}
