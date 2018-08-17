#include <ESP8266WiFi.h>
#include <FirebaseArduino.h>
#include <DHT11.h>

// Set these to run example.
#define FIREBASE_HOST "mise-3795b.firebaseio.com"
#define FIREBASE_AUTH "PD2N1V1zCi9FdfefMYVNB49R0YdMogQx74a8tB3h"
#define WIFI_SSID "KTEgg145"
#define WIFI_PASSWORD "kaii1357!!i"
#define DHT11_Delay 5000

//전역변수 선언
//ppd42ns
int ppd42ns_pin = 5;
unsigned long duration;
unsigned long starttime;
unsigned long sampletime_ms = 5000;//sampe 30s ;
unsigned long lowpulseoccupancy = 0;

float pcsPerCF = 0;
float ugm3 = 0;
float ratio = 0;
float concentration = 0;

//PM 평균
int count = 0;
float total = 0;
float average = 0;

//
int dht11_pin = 4;
DHT11 dht11(dht11_pin);



void setup() {
  Serial.begin(115200);
  pinMode(ppd42ns_pin, INPUT);
  starttime = millis();

  // connect to wifi.
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("connecting");
  Serial.print(WIFI_SSID); Serial.println(" ...");

  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(++i); Serial.print(' ');
  }

  Serial.println('\n');
  Serial.println("Connection established!");
  Serial.print("IP address:\t");
  Serial.println(WiFi.localIP());


  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.setFloat("pm10", 0);
  /*
    Firebase.set("sunlight", 0);
    Firebase.set("redlight", 0);
    Firebase.set("cooldown", 0);
    Firebase.set("brrr", 0);
  */
}



void loop() {

  ppd42ns();
  CallDHT11();
}


void CallDHT11(){
  int err;
  float temp, humi;
  if((err=dht11.read(humi, temp))==0)
  {
     Firebase.setFloat("temperature", temp);
    // handle error
    if (Firebase.failed()) {
      Serial.print("setting /number failed:");
      Serial.println(Firebase.error());
      return;
    }

     Firebase.setFloat("humidity", humi);
    // handle error
    if (Firebase.failed()) {
      Serial.print("setting /number failed:");
      Serial.println(Firebase.error());
      return;
    }
    Serial.print("temperature:");
    Serial.print(temp);
    Serial.print(" humidity:");
    Serial.print(humi);
    Serial.println();
  }
  else
  {
    Serial.println();
    Serial.print("Error No :");
    Serial.print(err);
    Serial.println();    
  }
  delay(DHT11_Delay); //delay for reread
}

void ppd42ns() {

  duration = pulseIn(ppd42ns_pin, LOW);
  lowpulseoccupancy = lowpulseoccupancy + duration;

  if ((millis() - starttime) > sampletime_ms) //if the sampel time == 30s
  {
    ratio = lowpulseoccupancy / (sampletime_ms * 10.0); // Integer percentage 0=>100
    concentration = 1.1 * pow(ratio, 3) - 3.8 * pow(ratio, 2) + 520 * ratio + 0.62; // using spec sheet curve
    pcsPerCF = concentration * 100;
    ugm3 = pcsPerCF / 7000;
    averagePM10(ugm3);
    Serial.print("PM10 = ");
    Serial.print(ugm3);
    Serial.println("\n");


    lowpulseoccupancy = 0;
    starttime = millis();
  }
}


void averagePM10(float data) {


  count += 1;
  total += data;
  Serial.print("count is ");
  Serial.print(count);
  Serial.println("");

  Serial.print("total is ");
  Serial.print(total);
  Serial.println("");

  if (count >= 10) {
    average = total / count;
    Serial.print("average = ");
    Serial.print(average);
    Serial.println("");

    
    Firebase.setFloat("pm10", average);
    // handle error
    if (Firebase.failed()) {
      Serial.print("setting /number failed:");
      Serial.println(Firebase.error());
      return;
    }
    
    count = 0;
    total = 0;
  }



}
