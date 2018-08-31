const request = require('request');
const xml2js = require('xml2js');
var parser = new xml2js.Parser();
var firebase = require("firebase");
var isTrue = 1;
var DB_dataTime;
//파이어베이스 설정
var config = {
  apiKey: "PD2N1V1zCi9FdfefMYVNB49R0YdMogQx74a8tB3h",
  authDomain: "mise-3795b.firebaseapp.com",
  databaseURL: "mise-3795b.firebaseio.com",
};
firebase.initializeApp(config);

const url = 'http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getCtprvnMesureSidoLIst';
let queryParams = `?${encodeURIComponent('ServiceKey')}=LhiHR3TDCO1P1Fr7QlCRft%2BkxQAf8E30H9xqobFBn3L7Q1cy0oJNW9RIbKwpZonnXNmp%2BhS%2Fb8laIe5G%2B0Algw%3D%3D`; /* Service Key */
queryParams += `&${encodeURIComponent('sidoName')}=${encodeURIComponent('부산')}`; /* dong : 동(읍/면)명 road :도로명[default] post : 우편번호 */
queryParams += `&${encodeURIComponent('searchCondition')}=${encodeURIComponent('HOUR')}`; /* 시간 */
queryParams += `&${encodeURIComponent('numOfRows')}=${encodeURIComponent('16')}`; /* 페이지당 출력될 개수를 지정 */




  try{
    setInterval(function(){
        get_api();
    }, 10000)
  } catch(e){
    console.log("Error : ", e);
  }





function get_api(){
  request({
    url: url + queryParams,
    method: 'GET',
  }, (error, response, body) => {
    //console.log('Status', response.statusCode);
    //console.log('Headers', JSON.stringify(response.headers));
    //console.log('Reponse received', body);

    parser.parseString(body, function(err, result) {
      //var jsontext = JSON.stringify(result);
      var jObj = new Object();
      jObj = JSON.stringify(result);
      var c
      var parsedJson = JSON.parse(jObj);
      var pObj = new Object();
      var dataTime = parsedJson.response.body[0].items[0].item[0].dataTime[0];
      getDataTime();

      if(dataTime != DB_dataTime){
        console.log('update');
        setBusanDataTime(dataTime);
        for(var i=0; i < parsedJson.response.body[0].totalCount[0]; i++){
          var cityName = parsedJson.response.body[0].items[0].item[i].cityName[0];
          var so2Value = parsedJson.response.body[0].items[0].item[i].so2Value[0];
          var coValue = parsedJson.response.body[0].items[0].item[i].coValue[0];
          var o3Value = parsedJson.response.body[0].items[0].item[i].o3Value[0];
          var no2Value = parsedJson.response.body[0].items[0].item[i].no2Value[0];
          var pm10Value  = parsedJson.response.body[0].items[0].item[i].pm10Value[0];
          var pm25Value  = parsedJson.response.body[0].items[0].item[i].pm25Value[0];
          var caiValue = calcPM10CAI(pm10);
          setBusan(cityName, so2Value, coValue, o3Value, no2Value, pm10Value, pm25Value, caiValue);
        }
      }else{
        console.log('no update');
      }


      //console.log(firebase.database().ref('led_B').once('value'));

  });
  })
}

function setBusanDataTime(datatime){
  firebase.database().ref('부산/airQuality').set({
      dataTime : datatime
  });
}

function setBusan(cityName, so2, co, o3, no2, pm10, pm25, cai){
  firebase.database().ref('부산/airQuality' + cityName).set({
      caiValue : cai,
      coValue : co,
      no2Value : no2,
      o3Value : o3,
      pm10Value : pm10,
      pm25Value : pm25,
      so2Value : so2
  });
}

function calcPM10CAI(pm10){
  var cai;
  if(pm10>0 && pm10<30){
    cai = '좋음';
  }else if(pm10>31 && pm10<50){
    cai = '보통';
  }else if(pm10>50 && pm10<100){
    cai = '나쁨';
  }else if(pm10>100){
    cai = '매우나쁨';
  }
  return cai;
}

function getDataTime() {
  return firebase.database().ref('/부산/dataTime').once('value').then(function(snapshot) {
    DB_dataTime = (snapshot.val());
  });
}
