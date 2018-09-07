const csv = require("csv-parser")
const fs = require("fs");
const moment = require("moment");
const Table = require("cli-table");

const good = "Good friends (1 stars, 1 day)";
const great = "Great friends (2 stars, 7 days)";
const ultra = "Ultra friends (3 stars, 30 days)";
const friendship_level = "Friendship level with the person you traded with?";
const trading_partner_level = 'Trading Partner\'s Trainer Level'
const caught_date_received = 'Caught date (for the Pokemon you received)';
const caught_date_sent = 'Caught date (for the Pokemon you gave away)';
const trade_date = 'Date of trading';
const timestamp = 'Timestamp';
const atk_iv = 'ATK IV';
const def_iv = 'DEF IV';
const sta_iv = 'STA IV';
const lucky = "Did you receive a Lucky Pokemon from this trade?";
const trading_medal = "Your trading medal (Gentleman)";
const trading_distance_medal = "Your trading distance medal (Pilot)";

const parseIfNumber = (item) => {
    if(item.indexOf('/') != -1)
        return item;

    if(item.indexOf(".") != -1 && parseFloat(item)) {
        return parseFloat(item)
    } 
    else if(parseInt(item)) {
        return parseInt(item);
    }

    if(item == "")
        return null;

    return item;
};

const parseIfDate = (item) => {
    if(item 
    && item.toString().indexOf('/') != -1
) {
        return moment(item, 'MM/DD/YYYY')
    }

    return item;
}

var parsed = [];

fs.createReadStream('data.csv').pipe(csv())
.on('data', function (data) {
    for (const key in data) {
        data[key] = parseIfNumber(data[key])
        data[key] = parseIfDate(data[key])
    }

    parsed.push(data);
})
.on('end',  function () {
    PrintLuckyIVRelation(parsed)
    PrintLuckyInRelationToYearAndDate(parsed)
    PrintLuckyMedalRelation(trading_medal, parsed)
    PrintLuckyMedalRelation(trading_distance_medal, parsed)
});

function PrintLuckyIVRelation(data) {
    var mapped = data

    .filter(d => {
        return d[def_iv] != null 
            && d[atk_iv] != null
            && d[sta_iv] != null
    });

    var result = new Table({
        head: ["IV", "Lucky (Y)", "%", "Lucky (N)", "%", "Total"]
    })


    for(var i = 0; i <= 15; i++) {
        var lucky_count = 0;
        var normal_count = 0;
        var total = 0;

        mapped
        .filter(d => {
            return d[atk_iv] == i;
        })
        .forEach(d => {
            if(d[lucky] === 'Yes')
                lucky_count++;
            else
                normal_count++;

            total++;
        });

        result.push([
            i,
            lucky_count,
            ((lucky_count / total) * 100).toFixed(1),
            normal_count,
            ((normal_count / total) * 100).toFixed(1),
            total
        ]);
    }

    console.log("IV relation")
    console.log(result.toString());
}

function PrintLuckyMedalRelation(medal, data) {
    var mapped = data

    .filter(d => {
        return d[medal] != null 
    });

    var result = new Table({
        head: ["Medal Level", "Lucky (Y)", "%", "Lucky (N)", "%", "Total"]
    })

    var levels = [
        'Gold',
        'Silver',
        'Bronze',
        'None'
    ]

    for(var i = 0; i < 4; i++) {
        var lucky_count = 0;
        var normal_count = 0;
        var total = 0;
        var medal_level = levels[i];

        mapped
        .filter(d => {
            return d[medal] == medal_level;
        })
        .forEach(d => {
            if(d[lucky] === 'Yes')
                lucky_count++;
            else
                normal_count++;

            total++;
        });

        result.push([
            medal_level,
            lucky_count,
            ((lucky_count / total) * 100).toFixed(1),
            normal_count,
            ((normal_count / total) * 100).toFixed(1),
            total
        ]);
    }

    console.log("Medal relation", medal)
    console.log(result.toString());
}

function PrintLuckyInRelationToYearAndDate(data) {
    var mapped = data

    .filter(d => {
        return d[caught_date_sent] != null 
            && d[caught_date_received] != null
            && d[trade_date].year() === 2018
    })

    .map(d => {
        return {
            [lucky]: d[lucky],

            rec_day: d[caught_date_received].date(),
            rec_month: d[caught_date_received].month() + 1,
            rec_year: d[caught_date_received].year(),

            sent_day: d[caught_date_sent].date(),
            sent_month: d[caught_date_sent].month() + 1,
            sent_year: d[caught_date_sent].year(),

            days_between_earliest_caught_date_and_trading_date: 
                Math.max(
                    Math.abs(d[trade_date].diff(d[caught_date_sent], 'd')),
                    Math.abs(d[trade_date].diff(d[caught_date_received], 'd')),
                )
            ,

            caught_dates_day_diff: Math.abs(d[caught_date_received].diff(d[caught_date_sent], 'd'))
        }
    });

    const range_count = 14;
    const range_step = 60;

    var ranges = Array.from(Array(range_count).keys()).map((v, i) => [ i * range_step, (i + 1) * range_step])
    var obj_ranges = ranges.reduce((obj, range) => {
        obj[range] = {
            min: range[0],
            max: range[1],
        }
        return obj;
    }, {});
    
    var print = new Table({
        head: ["Min", "Max", "Lucky (Y)", "%", "Lucky (N)", "%", "Total"]
    })

    for (const range in obj_ranges) {
        var yes = 0;
        var no = 0;
        var total = 0;

        mapped
        .filter(e => 
            e.days_between_earliest_caught_date_and_trading_date > obj_ranges[range].min 
         && e.days_between_earliest_caught_date_and_trading_date <= obj_ranges[range].max
        )
        .forEach(element => {
            if(element[lucky] == 'Yes') {
                yes++;
            } else {
                no++;
            }

            total++;
            
            obj_ranges[range].yes = yes;
            obj_ranges[range].no = no;
            obj_ranges[range].total = total;            
        })

        print.push(
            [
                obj_ranges[range].min || 0,
                obj_ranges[range].max || '',
                obj_ranges[range].yes || '',
                (obj_ranges[range].yes / obj_ranges[range].total * 100).toFixed(1),
                obj_ranges[range].no || '',
                (obj_ranges[range].no / obj_ranges[range].total * 100).toFixed(1),
                obj_ranges[range].total || '',
            ]
        )        
    }

    console.log("Age relation")
    console.log(print.toString())
}
