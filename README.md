For more info, see [Passport][1].


To use Twitter, create an [application][2].
> Make sure the *Callback URL* matches the info in your config.json + app.js:

>       config.origin + "/auth/twitter/callback"


To use Facebook, create an [application][3].
> Make sure the *Valid OAuth redirect URIs* matches the info in your config.json + app.js:

>       config.origin + "/auth/facebook/callback"


Setup

    :::bash
        $ npm install
        $ cp config.json.example config.json
        $ # edit config.json
        $ ./app.js 


[1]: http://passportjs.org/
[2]: https://dev.twitter.com/
[3]: https://developers.facebook.com/
