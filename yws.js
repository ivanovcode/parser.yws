//./vendor/ariya/phantomjs/bin/phantomjs --web-security=no yws.js 003fa7c1cd658bca6016eae7c179f012 ivanov.vladimir.v sp@rt@nec "пиджеум" "desktop" "weekly"
function ajax(url, params, callback) {
    var xhr = new XMLHttpRequest();    
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function(){
        if (this.readyState == 4) {
            if (this.status == 200) {
                callback(this.responseText);       
            } else {
                callback(this.responseText); 
            }            
        }
    };
    xhr.send(params);
}
function pushJSON(phantom) {
    var result = {};  
    var success = [];
    result.success = 'false';
    console.log(JSON.stringify(result));
    phantom.exit(); 
} 
var page = require('webpage').create(),
    system = require('system');
var args = system.args;
var data = [];
var clientKey = system.args[1];

var url = [];
if(system.args[5]!='') url.push('db='+system.args[5]);
if(system.args[6]!='') url.push('period='+system.args[6]);
if(system.args[4]!='') url.push('words='+encodeURIComponent(system.args[4]));
url = 'https://wordstat.yandex.ru/#!/history?' + url.join('&');
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0';
page.open(url, function (status) {
    page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js', function () {
        page.evaluate(function(args) {
            var login = document.getElementsByClassName('b-domik_type_popup')[0];   
            var username = document.getElementById('b-domik_popup-username');
            var password = document.getElementById('b-domik_popup-password');
            username.value = args[2];
            password.value = args[3];  
            $(document).ready(function(){
                $('.b-form-button__input').click();
            }); 
        }, args);
        setTimeout(function() {
            page.evaluate(function() {
                $(document).ready(function(){
                    $('.b-form-button__input').click();
                }); 
            });
        }, 5000);
        setTimeout(function() {            
            var clipRect = page.evaluate(function() {
                var captcha = document.getElementsByClassName('b-popupa__content')[0];                              
                var clipRect = captcha.getBoundingClientRect();
                return clipRect;
            }, 'clipRect');                           
            page.clipRect = {
                top:    174,
                left:   395,
                width:  175,
                height: 71
            };
            //page.render('log/captcha.png');
            var base64 = page.renderBase64('PNG');   
            var arg = '{"clientKey":"'+clientKey+'","task":{"type":"ImageToTextTask","body":"'+base64+'","phrase":false,"case":false,"numeric":false,"math":0,"minLength":0,"maxLength":0}}';            
            ajax('http://api.anti-captcha.com/createTask', arg, function(response){
                var response = JSON.parse(response);    
                //console.log('antigate decoding ... task: '+response['taskId']);  
                var arg = '{"clientKey":"'+clientKey+'","taskId":"'+response['taskId']+'"}'; 
                var result;
                var getTaskResult = setInterval(function() { 
                    ajax('http://api.anti-captcha.com/getTaskResult', arg, function(response){
                        var response = JSON.parse(response);     
                        if(response['status']=='ready') {           
                            //console.log('antigate decode: '+response['solution']['text']);  
                            result = response['solution']['text'];
                            clearInterval(getTaskResult);
                        }                                   
                    }); 
                }, 10000);   
                var captchaPush = setInterval(function() {  
                    if(result != undefined) {
                        var captcha_input = page.evaluate(function(result) {
                            var captcha_input = document.getElementsByClassName('b-form-input__input')[1];                             
                            captcha_input.focus(); 
                            return captcha_input;
                        }, result);    
                        for (var i = 0, len = result.length; i < len; i++) {   
                            page.sendEvent('keypress', result[i]);                                    
                        }
                        setTimeout(function() {                            
                            page.sendEvent('keypress', page.event.key.Enter);  
                        }, 5000); 
                        setTimeout(function() { 
                            page.clipRect = { left:0, top:0, width:0, height:0 }
                            //page.render('log/month.png');
                            var result = {};
                            result['success'] = 'true';
                            result['balance'] = '';
                            result['filters'] = {};
                            result['filters']['db'] = system.args[5];
                            result['filters']['period'] = system.args[6];
                            result['filters']['word'] = system.args[4];
                            result['response'] = {};
                            result['response']['history'] = {};  
                            var weekly = page.evaluate(function(pushJSON) {
                                var id = 0;
                                var weekly = {}; 
                                for (var j=0; j<=1; j++) {
                                    var obj = document.getElementsByClassName('b-history__table-body')[j];  
                                    if (typeof obj === "undefined") { pushJSON(phantom); }
                                    var elements = [];
                                    for (var i=0; i<obj.childNodes.length; i++) {
                                        var child = obj.childNodes[i];
                                        if (child.nodeType == 1) {
                                            id++;
                                            weekly[id] = {};    
                                            weekly[id]['period'] = child.getElementsByTagName("td")[0].outerText; 
                                            weekly[id]['value'] = child.getElementsByClassName('b-history__value-td')[0].outerText;
                                        }
                                    }
                                }
                                document.getElementsByClassName('b-form-radio__radio')[1].click();  
                                return weekly;
                            }, pushJSON); 
                            result['response']['history'] = weekly;

                            var balance;
                            var arg = '{"clientKey":"'+clientKey+'"}'; 
                            ajax('http://api.anti-captcha.com/getBalance', arg, function(response){     
                            var response = JSON.parse(response);     
                                balance = response['balance'];
                            }); 
                            var getBalance = setInterval(function() { 
                                if (typeof balance != "undefined") {
                                    //console.log(balance); 
                                    clearInterval(getBalance); 
                                    result['balance'] = balance; 
                                    console.log(JSON.stringify(result));  
                                    phantom.exit();
                                }
                             }, 1000);          

                        }, 10000);    
                        clearInterval(captchaPush);                     
                    }  
                }, 10000);   
            });  
        }, 10000);  
    });
});
