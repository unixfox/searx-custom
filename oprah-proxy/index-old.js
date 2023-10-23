const got = require('got');
const tunnel = require('tunnel');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const yaml = require('yaml');
const uuid = require("uuid");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let doc = yaml.parse(fs.readFileSync('/usr/local/searx/searx/settings.yml', 'utf8'));
const enginesToProxy = ["google", "etools", "bing", "qwant", "qwant images", "qwant social", "qwant news", "apk mirror", "pubmed", "soundcloud"];
let arrayOfEnginesToProxy = doc.engines.filter(engine => enginesToProxy.includes(engine.name));
doc.engines = doc.engines.filter(engine => !enginesToProxy.includes(engine.name));
for (let i = 0; i < arrayOfEnginesToProxy.length; i++) {
    arrayOfEnginesToProxy[i].proxies = {};
    arrayOfEnginesToProxy[i].proxies["all://"] = [];
}

exec('python -W ignore /usr/bin/returnOprahProxy.py').then((result) => {
    const proxyAuth = JSON.parse(result.stdout).username + ":" + JSON.parse(result.stdout).password;
    for (let j = 244; j <= 247; j++) {
        const startIp = "77.111." + j + ".";
        for (let i = 0; i <= 255; i++) {
            got('https://1.1.1.1', {
                retry: 0,
                agent: {
                    https: tunnel.httpsOverHttps({
                        proxy: {
                            host: startIp + i,
                            port: 443,
                            proxyAuth: proxyAuth
                        }
                    })
                },
                timeout: 3500
            }).then(async () => {
                await fs.appendFileSync("/etc/hosts", "\n" + startIp + i + " " + startIp.replaceAll(".", "") + i + ".sec-tunnel.com");
                for (let k = 0; k < arrayOfEnginesToProxy.length; k++)
                    arrayOfEnginesToProxy[k].proxies["all://"].push("https://" + proxyAuth + "@" + startIp.replaceAll(".", "") + i + ".sec-tunnel.com:443");
            }).catch((error) => {
            });
        }
    }
});

const instanceHola = got.extend({
    prefixUrl: 'https://client.hola.org/client_cgi',
    headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36"
    },
    http2: true,
    responseType: 'json',
    resolveBodyOnly: true,
});

const uuidGenerated = uuid.v4().replace(/-/g, '');

/* ["be", "nl", "de", "fr", "pl", "es", "cz",
    "dk", "fi", "hr", "hu", "se", "ro", "sk", "at", "no",
    "ch", "is", "uk", "ru", "ie", "tr", "gr", "bg", "ca", "gb"]
*/

const holaCountries = ["be", "nl", "de", "fr"];

instanceHola('background_init?uuid=' + uuidGenerated, {
    method: "POST",
    form: {
        "login": 1,
        "ver": "1.181.350"
    }
}).then((body) => {
    holaCountries.forEach(country => {
        instanceHola('zgettunnels?browser=chrome&country=' + country + '&ext_ver=1.181.350&is_premium=0&limit=999&ping_id='
            + Math.random().toFixed(16) + "&product=cws&session_key=" + body.key + "&uuid=" + uuidGenerated).then((body) => {
                const proxyAuth = "user-uuid-" + uuidGenerated + ":" + body.agent_key;
                Object.keys(body.ip_list).forEach(function (hostIP) {
                    got('https://1.1.1.1', {
                        retry: 0,
                        agent: {
                            https: tunnel.httpsOverHttps({
                                proxy: {
                                    host: body.ip_list[hostIP],
                                    port: 22222,
                                    proxyAuth: proxyAuth
                                }
                            })
                        },
                        timeout: 5000
                    }).then(async () => {
                        for (let k = 0; k < arrayOfEnginesToProxy.length; k++)
                            arrayOfEnginesToProxy[k].proxies["all://"].push("https://" + proxyAuth + "@" + hostIP + ":22222");
                    }).catch((error) => {
                    });
                });
            });
    });

});

setTimeout(async () => {
    if (arrayOfEnginesToProxy[0].proxies["all://"].length === 0)
        process.exit(1);
    Array.prototype.push.apply(doc.engines, arrayOfEnginesToProxy);
    let convertToYaml = await yaml.stringify(doc);
    convertToYaml = convertToYaml.replace(" key: ", " key: !!binary ");
    await fs.writeFileSync("/usr/local/searx/searx/settings.yml", convertToYaml, 'utf8');
    process.exit(0);
}, 30000);