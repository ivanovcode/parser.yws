# parser.yws 

Console parser of the full history of Yandex Wordstat statistics using https://anti-captcha.com/

## Getting Started
1. Download: 
`git clone ssh://git@github.com/drsupport/parser.yws.git .`

2. Install: 
`./composer.phar install`

3. Using: 
`./vendor/ariya/phantomjs/bin/phantomjs --web-security=no yws.min.enc.js <anticaptcha-token> <yandex-login> <yandex-password> "word" "desktop" "weekly"`

