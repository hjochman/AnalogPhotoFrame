//<div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> 
//from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> 
//is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" 
//target="_blank">CC 3.0 BY</a></div>

import clock from "clock";
import document from "document";
import { inbox } from "file-transfer";
import { display } from "display";
import { me } from "appbit";
import * as fs from "fs";
import { geolocation } from "geolocation";

import * as util from "../common/utils";
import * as SunCalc from "../common/suncalc";

let colors = [
    "white", "black" ,"yellow", "red" , "olivedrab", "maroon", "navy", "blueviolet", "chartreuse", "coral", "darkmagenta", "darkkhaki", "darksalmon", "gold"
];
let colorNr = 0;

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

// Update the clock every second
clock.granularity = "seconds";

let batteryField = document.getElementById('battery');
let date = document.getElementById('date');
let dayOfWeek = document.getElementById('dayOfWeek');
let hourHand = document.getElementById("hours");
let minHand = document.getElementById("mins");
let secHand = document.getElementById("secs");
let back = document.getElementById("background");
let ziffer = document.getElementById("zifferblatt");

let currentStepsField = document.getElementById('currentSteps');
let levelText = document.getElementById("level");
let hrBat = document.getElementById("bat");
let hrLabel = document.getElementById("hrm");
let hrIcon = document.getElementById("heart");
let stepIcon = document.getElementById("iconStep");
let floorIcon = document.getElementById("iconFloor");
let hrIconEmpty = document.getElementById("heartEmpty");

let sunSet = document.getElementById("sunSet");
let sunRise = document.getElementById("sunRise");
let moon = document.getElementById("moon");
let sunUpdate = 0;
let lastDay = 0;

let codePoint = 0;
var msDiff = 0;

//Load settings
let mySettings;
// Load settings from filesystem
try {
  mySettings = fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  console.log("settings file loaded");
  colorNr=mySettings.fill;
  setFill(colors[colorNr]);
  setSun();
  console.log("bg: " + mySettings.bg);  
  if (mySettings.bg && mySettings.bg !== "") {
      back.image = mySettings.bg;
    }
    console.log("settings loaded");
 } catch (ex) {
    mySettings = {};
    mySettings.fill=colorNr;
    console.log("no settings file");
  } 

// Save settings to the filesystem
function saveSettings() {
  mySettings.fill = colorNr;
  fs.writeFileSync(SETTINGS_FILE, mySettings, SETTINGS_TYPE);
  console.log("settings saved");
}

me.onunload = saveSettings;

// ------------------------------  Sun adn Moon ----------------------------------------
//geolocation.getCurrentPosition(locationSuccess, locationError);

function locationSuccess(position) {
//  console.log("Latitude: " + position.coords.latitude, "Longitude: " + position.coords.longitude);
  mySettings.latitude = position.coords.latitude;
  mySettings.longitude = position.coords.longitude

  setSun();
}

function locationError(error) {
  console.log("Error: " + error.code,
              "Message: " + error.message);
}

function setSun() {
  if (mySettings.latitude && mySettings.longitude) {
    var times = SunCalc.getTimes(new Date(), mySettings.latitude, mySettings.longitude);
    sunRise.groupTransform.rotate.angle = hoursToAngle(times.sunrise.getHours(), times.sunrise.getMinutes());
    sunSet.groupTransform.rotate.angle = hoursToAngle(times.sunset.getHours(), times.sunset.getMinutes());
  }
}

//New file from settings page
inbox.onnewfile = () => {
  let fileName;
  do {
    fileName = inbox.nextFile();
    if (fileName) {
      if (mySettings.bg && mySettings.bg !== "") {
        console.log("Delete: " + mySettings.bg);
        fs.unlinkSync(mySettings.bg);
      }
      mySettings.bg = `/private/data/${fileName}`;
      back.image = mySettings.bg;
      display.on = true;
    }
  } while (fileName);
};

// Returns an angle (0-360) for the current hour in the day, including minutes
function hoursToAngle(hours, minutes) {
  let hourAngle = (360 / 12) * (hours % 12);
  let minAngle = (360 / 12 / 60) * minutes;
  return hourAngle + minAngle;
}

// Returns an angle (0-360) for minutes
function minutesToAngle(minutes) {
  return (360 / 60) * minutes;
}

// Returns an angle (0-360) for seconds
function secondsToAngle(seconds) {
  return (360 / 60) * seconds;
}

// Rotate the hands every tick
function updateClock() {
  let today = new Date();
  let hours = today.getHours();
  let mins = today.getMinutes();
  let secs = today.getSeconds();

  //Update sun and moon every hour
  var currentHours = (today.getFullYear()-2017) * 8928 + today.getMonth() * 744 + today.getDay() * 24 + today.getHours();
  if (sunUpdate == 0) { //Init afer new start
    console.log("Init sunUpdate: " + currentHours);
    sunUpdate = currentHours;
  } else if ( (currentHours - sunUpdate) > 0) {
    console.log("start sunUpdate");
    sunUpdate = currentHours;
    //geolocation.getCurrentPosition(locationSuccess, locationError);
  }

  if (hours <= 6) {
    back.style.visibility="hidden";
  } else {
    back.style.visibility="visible";    
  }
  
  if ((secs % 2 == 0) || (hrLabel.text == "??")) {
     hrIcon.style.visibility="hidden";
  } else {
     hrIcon.style.visibility="visible";    
  }
  
  hourHand.groupTransform.rotate.angle = hoursToAngle(hours, mins);
  minHand.groupTransform.rotate.angle = minutesToAngle(mins);
  secHand.groupTransform.rotate.angle = secondsToAngle(secs);
  updateDate();
}

//DATE
let monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

let dayNames = [
    "Sunday","Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

function updateDate() {
    let dayInfo = new Date();
    let day = dayInfo.getDay();
    let month = dayInfo.getMonth();
    let dayOfMonth = dayInfo.getDate();

    if (lastDay != dayOfMonth) {
      lastDay = dayOfMonth;
      date.text = `${monthNames[month]} ${dayOfMonth}`;
      dayOfWeek.text = `${dayNames[day]}`;

      setSun();

      var moonIllumination = SunCalc.getMoonIllumination(dayInfo);
      moon.groupTransform.rotate.angle = moonIllumination.fraction * 360;
    }
}

// Update the clock every tick event
clock.ontick = () => updateClock();

// Background

var myBTN1 = document.getElementById("myButton1");

myBTN1.onclick = function(e) {
  colorNr++;
  if (colorNr > 13){
    colorNr=0;
  }
  console.log("nr: "+colorNr);
  setFill(colors[colorNr]);
}

function setFill(color) {
  console.log("set color: "+color);
  ziffer.style.fill=color; 
  hrBat.style.fill=color;
  hrLabel.style.fill=color;
  hrIconEmpty.style.fill=color;
  hrIcon.style.fill=color;
  stepIcon.style.fill=color;
  floorIcon.style.fill=color;
  date.style.fill=color;
  dayOfWeek.style.fill=color;
  batteryField.style.fill=color;
  hrLabel.style.fill=color;
  currentStepsField.style.fill=color;
  levelText.style.fill=color;
}

//BATTERY
import { battery } from "power";

function updateBattery() {
    let batteryPercentage = Math.floor(battery.chargeLevel);

    batteryField.text = `${batteryPercentage}%`;
    if (batteryPercentage < 30) {
      hrBat.style.fill="red";
    } else {
      hrBat.style.fill=colors[colorNr];    
    }
}

updateBattery();
battery.onchange = () => updateBattery();

//STEPS - ELEVATION
import userActivity from "user-activity";


function updateSteps() {
    currentStepsField.text = (userActivity.today.local.steps || 0);
    levelText.text = userActivity.today.local.elevationGain;
}


//HEART RATE MONITOR
import { HeartRateSensor } from "heart-rate";
import { user } from "user-profile";

var hrm = new HeartRateSensor();
let hr0 = document.getElementById("hr0");
let hrs = document.getElementById("hrs");
let hr1 = document.getElementById("hr1");
let hr2 = document.getElementById("hr2");
let hr3 = document.getElementById("hr3");
let hr4 = document.getElementById("hr4");

let hrmLastTimeStamp = 0;

hrLabel.text = "??";

// Returns an angle (0-360) for minutes
function setHRicon(level) {
  if (level == "out-of-range"){
    hr0.style.visibility="hidden";
    hrs.style.visibility="hidden";
    hr1.style.visibility="visible";
    hr2.style.visibility="hidden";
    hr3.style.visibility="hidden";
    hr4.style.visibility="hidden";
  } else if (level == "fat-burn") {
    hr0.style.visibility="hidden";
    hrs.style.visibility="hidden";
    hr1.style.visibility="hidden";
    hr2.style.visibility="visible";
    hr3.style.visibility="hidden";
    hr4.style.visibility="hidden";
  } else if (level == "cardio") {
    hr0.style.visibility="hidden";
    hrs.style.visibility="hidden";
    hr1.style.visibility="hidden";
    hr2.style.visibility="hidden";
    hr3.style.visibility="visible";
    hr4.style.visibility="hidden";
  } else if (level == "peak") {
    hr0.style.visibility="hidden";
    hrs.style.visibility="hidden";
    hr1.style.visibility="hidden";
    hr2.style.visibility="hidden";
    hr3.style.visibility="hidden";
    hr4.style.visibility="visible";
  } else if (level == "CouchPotato") {
    hr0.style.visibility="hidden";
    hrs.style.visibility="visible";
    hr1.style.visibility="hidden";
    hr2.style.visibility="hidden";
    hr3.style.visibility="hidden";
    hr4.style.visibility="hidden";             
  } else {
    hr0.style.visibility="visible";
    hrs.style.visibility="hidden";
    hr1.style.visibility="hidden";
    hr2.style.visibility="hidden";
    hr3.style.visibility="hidden";
    hr4.style.visibility="hidden";    
  }
}


hrm.onreading = function(read) {
    let heartRate = hrm.heartRate;
    let hrZone = user.heartRateZone(heartRate);

    hrLabel.text = heartRate;
    setHRicon(hrZone);
    hrm.stop();
}

hrm.onerror = function() {
    hrLabel.text = '??';
    setHRicon("dead");
}

hrm.start();

//INTERVAL
setInterval(intervalFunction, 2500);

function intervalFunction() {
    if (display.on) {
        hrm.start();
        updateSteps();

        if (hrmLastTimeStamp == hrm.timestamp) {
            if (hrLabel.text == "??") {
              setHRicon("dead");
            } else {
              setHRicon("CouchPotato");
            }
         } else {
         hrmLastTimeStamp = hrm.timestamp;
        }
    }
}

display.onchange = function(event) {
    if (display.on) {
        hrm.start();
        updateSteps();
    } else {
        hrm.stop();
    }
};
