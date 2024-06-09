//生成地圖
console.log("test");

var map = L.map('map', {
    center: [23.5631433,120.4744241],
    zoom: 17
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//導入經緯度座標
import building from './data/cleaned_locations.json.js';
import course from './data/all_course.json.js';

var addedCourse = [];
var addedCourseIdx = [];
let allMarkerArr = []; //暫時沒用
let markerCluster = L.markerClusterGroup(); //用來匯集同一經緯度的點
let routing = null;
let routeStart = {"LatLng":null, "marker":null, "btnStatus":null, "index":null};
let routeEnd = {"LatLng":null, "marker":null, "btnStatus":null, "index":null};

let iconBlue = L.icon({
    iconUrl: './img/marker-blue.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -55]
});
let iconRed = L.icon({
    iconUrl: './img/marker-red.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -55]
});
let iconGreen = L.icon({
    iconUrl: './img/marker-green.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -55]
});


var credit = 0;
var isSpare = new Array(6); //三維陣列 天-小時-15分鐘
var addedTimeClass = [];
for(let i = 0; i < 6; i++){
    isSpare[i] = new Array(15);
    for(let j = 0; j < 15; j++){
        isSpare[i][j] = new Array(4).fill(1);
    }
}
var dayOfWeekCh = {'一': 0, '二': 1, '三': 2, '四': 3, '五': 4, '六': 5, '日': 6};
var dayOfWeekEn = ['Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'];
var numtoday="一二三四五六日";

//check cookie
console.log(document.cookie);
if(document.cookie != "" && document.cookie != "course=[]"){
    let cookieSplit = document.cookie.split("course=");
    let cookieIdx = JSON.parse(cookieSplit[1]);
    console.log(cookieIdx);
    for(let i = 0; i < cookieIdx.length; i++){
        if(cookieIdx[i][1]){
            addcourse(parseInt(cookieIdx[i][0]), {"value":""}, "normal");
        }if(!cookieIdx[i][1]){
            addcourse(parseInt(cookieIdx[i][0]), {"value":""}, "cookie");
            //document.getElementById("classTable").getElementsByTagName("tr")[i].lastChild.firstChild.click();
        }
    }
}
function updateCookie(){
    document.cookie = "course="+JSON.stringify(addedCourseIdx);
    console.log(document.cookie);
}

function setRoutingMachine(){
    if(routing != null){
        map.removeControl(routing);
        routing = null;
    }if(routeStart.LatLng.lat == routeEnd.LatLng.lat && routeStart.LatLng.lng == routeEnd.LatLng.lng){
        alert("請勿將起點與終點設成同一大樓");
        closeRouting();
        return;
    }
    routing = L.Routing.control({
        waypoints: [
            routeStart.LatLng,
            routeEnd.LatLng
        ],
        router: L.Routing.graphHopper('8194dbf9-1c40-4795-9371-e70ab71cbd21', {
            urlParameters: {
                vehicle: 'foot'
            }
        }),
        createMarker: function() { return null; },
        draggableWaypoints: false,
        routeWhileDragging: false,
        addWaypoints: false
    });
    routing.addTo(map);
}

function routeStartFunc(obj, marker, markerLatLng, routeStartBtn){
    if(routeStartBtn.getAttribute('class') == 'routeStartBtn'){
        routeStartBtn.setAttribute('class', 'classTableIdxBtn');
        marker.setIcon(iconBlue);
        routeStart.btnStatus = null;
        routeStart.LatLng = null;
        routeStart.marker = null;
        routeStart.index = null;
    }else{
        if(routeStart.btnStatus != null){
            routeStart.btnStatus.setAttribute('class', 'classTableIdxBtn');
            routeStart.marker.setIcon(iconBlue);
        }routeStart.LatLng = markerLatLng;
        //routeStartBtn.setAttribute('class', 'routeStartBtn');
        routeStart.btnStatus = routeStartBtn;
        marker.setIcon(iconGreen);
        routeStart.marker = marker;
        routeStart.index = obj.index;
    }if(routeStart.LatLng != null && routeEnd.LatLng != null){
        setRoutingMachine();
    }else{
        if(routing != null){
            map.removeControl(routing);
            routing = null;
        }
    }
}

function routeEndFunc(obj, marker, markerLatLng, routeEndBtn){
    if(routeEndBtn.getAttribute('class') == 'routeEndBtn'){
        routeEndBtn.setAttribute('class', 'classTableIdxBtn');
        marker.setIcon(iconBlue);
        routeEnd.btnStatus = null;
        routeEnd.LatLng = null;
        routeEnd.marker = null;
        routeEnd.index = null;
    }else{
        if(routeEnd.btnStatus != null){
            routeEnd.btnStatus.setAttribute('class', 'classTableIdxBtn');
            routeEnd.marker.setIcon(iconBlue);
        }routeEnd.LatLng = markerLatLng;
        //routeEndBtn.setAttribute('class', 'routeEndBtn');
        routeEnd.btnStatus = routeEndBtn;
        marker.setIcon(iconRed);
        routeEnd.marker = marker;
        routeEnd.index = obj.index;
    }if(routeStart.LatLng != null && routeEnd.LatLng != null){
        setRoutingMachine();
    }else{
        if(routing != null){
            map.removeControl(routing);
            routing = null;
        }
    }
}

//增加課程選單中的課程
function createClassRow(obj, marker){
    let name = "<span style='font-size: 25px;'>"+obj['科目名稱'].split(/['\n'' ']/)[0]+'</span>';
    name+="<span style='font-size: 18px;'>"+' '+obj['任課教授']+' '+obj['上課時間']+"</span>";
    let table = document.getElementById("classTable");
    let row = table.insertRow(-1);
    //row.setAttribute("style", "align='center'");
    let cell1 = row.insertCell(-1); //課程名稱
    let cell2 = row.insertCell(-1); //刪除課程按鈕
    //let cell3 = row.insertCell(-1); //路線起點
    //let cell4 = row.insertCell(-1); //路線終點
    let cell5 = row.insertCell(-1); //加入時間表
    let cell6 = row.insertCell(-1); //移除時間表
    //1
    cell1.innerHTML = name;
    cell1.setAttribute('style', 'min-width:450px')
    //2
    let delBtn = document.createElement('button');
    delBtn.innerText = "刪除";
    delBtn.setAttribute('class', 'classTableIdxBtn');
    //let LatLng = marker.getLatLng();
    delBtn.onclick = function(){deleteMarkerRow(obj, marker, row)};
    cell2.appendChild(delBtn);
    /*
    //3
    let routeStartBtn = document.createElement('button');
    routeStartBtn.innerText = "設為路線起點";
    routeStartBtn.setAttribute('class', 'classTableIdxBtn');
    let markerLatLng = marker.getLatLng();
    routeStartBtn.onclick = function(){routeStartFunc(obj, marker, markerLatLng, routeStartBtn)};
    cell3.appendChild(routeStartBtn);
    //4
    let routeEndBtn = document.createElement('button');
    routeEndBtn.innerText = "設為路線終點";
    routeEndBtn.setAttribute('class', 'classTableIdxBtn');
    routeEndBtn.onclick = function(){routeEndFunc(obj, marker, markerLatLng, routeEndBtn)};
    cell4.appendChild(routeEndBtn);
    */
    //5
    let addTimeBtn = document.createElement('button');
    addTimeBtn.innerText = "加入時間表";
    addTimeBtn.setAttribute('class', 'classTableIdxBtn');
    cell5.appendChild(addTimeBtn);
    addTimeBtn.onclick = function(){appendTimeTable(obj, row)};
    //6
    let delTimeBtn = document.createElement('button');
    delTimeBtn.innerText = "移出時間表";
    delTimeBtn.setAttribute('class', 'classTableIdxBtn');
    cell6.appendChild(delTimeBtn);
    delTimeBtn.onclick = function(){restoreSpare(obj, row, "time")};
    return row; //將一整個row回傳，以讓刪除function判斷當下是第幾個row
}

//刪除marker
function deleteMarkerRow(obj, marker, row){
    console.log(obj.index);
    console.log(routeStart.index);
    console.log(routeEnd.index);
    if(obj.index == routeStart.index || obj.index == routeEnd.index){
        closeRouting();
    }for(let i = 0; i < addedCourse.length; i++){
        if(obj.index == addedCourse[i].index){
            addedCourse.splice(i, 1);
            addedCourseIdx.splice(i, 1);
            updateCookie();
        }
    }for(let i = 0; i < allMarkerArr.length; i++){
        if(obj.index == allMarkerArr[i].index){
            allMarkerArr.splice(i, 1);
        }
    }
    markerCluster.removeLayer(marker);
    document.getElementById("classTable").deleteRow(row.rowIndex);
    restoreSpare(obj, row, "delete");
}


//增加marker
function createMarker(obj, latitude, longitude, mode){// normal, cookie
    let name = obj['科目名稱'].split(/['\n'' ']/)[0];
    let marker = L.marker([latitude,longitude], {icon: iconBlue});
    let row = createClassRow(obj, marker);
    if(mode == "normal"){
        appendTimeTable(obj, row);
    }else{
        updateCookieArr(obj.index, 0);
        row.setAttribute('class', 'trConflict');
        row.getElementsByTagName('td')[2].style = 'display: block';
        row.getElementsByTagName('td')[3].style = 'display: none';
    }
    let parentDiv = document.createElement('div');
    let courseName = document.createElement('div');
    courseName.innerText = name;
    courseName.style = 'font-size:25';
    let courseAllName=document.createElement('div');
    courseAllName.id='allname';
    let subNamestr=obj['科目名稱'].split(/['\n'' ']/);
    for(var i=1;i<subNamestr.length;i++){
        if(subNamestr[i][0]=='('&&subNamestr[i][1]!='I')
            courseAllName.innerHTML+='<br>';
        courseAllName.innerHTML+=subNamestr[i]+' ';
    }
    courseAllName.innerHTML+='<br><hr>';
    let courseData=document.createElement('div');
    courseData.id='data';
    courseData.innerHTML='@'+obj['上課地點']+'<br>'+ obj['上課時間'] + ' ' + obj['任課教授']+'<br>';
    courseData.innerHTML+='<a href=\"https://ccu.plus/courses/'+obj['編號']+'\" target="_blank">CCU PLUS課程評價</a><br>';
    courseData.innerHTML+='<a href=\"https://www.dcard.tw/search?query='+name+'&forum=ccu'+'\" target="_blank">Dcard課程評價</a><br>';
    courseData.innerHTML+='<a href=\"https://www.dcard.tw/search?query='+obj['任課教授']+'&forum=ccu'+'\" target="_blank">Dcard教授評價</a><br><hr>';
    //courseData.style='font-size:15';
    let LatLng = marker.getLatLng();
    let popupDelBtn = document.createElement('button');
    popupDelBtn.innerText = '刪除';
    popupDelBtn.onclick = function(){deleteMarkerRow(obj, marker, row)};
    popupDelBtn.id = 'popupBtn';
    let popupStartBtn = document.createElement('button');
    popupStartBtn.innerText = '設為路線起點';
    popupStartBtn.onclick = function(){routeStartFunc(obj, marker, LatLng, row.getElementsByTagName('td')[2].children[0])};
    popupStartBtn.id = 'popupBtn';
    let popupEndBtn = document.createElement('button');
    popupEndBtn.innerText = '設為路線終點';
    popupEndBtn.onclick = function(){routeEndFunc(obj, marker, LatLng, row.getElementsByTagName('td')[3].children[0])};
    popupEndBtn.id = 'popupBtn';
    parentDiv.appendChild(courseName);
    parentDiv.appendChild(courseAllName);
    parentDiv.appendChild(courseData);
    parentDiv.appendChild(popupDelBtn);
    parentDiv.appendChild(popupStartBtn);
    parentDiv.appendChild(popupEndBtn);
    let popupOption = {className: "popupBox", maxWidth : 1000};
    marker.bindPopup(parentDiv, popupOption).openPopup();
    marker.bindTooltip(name).openTooltip();
    allMarkerArr.push({'index': obj.index,'marker':marker});
    markerCluster.addLayer(marker);
}

//右上角選單 關或開
let menuStatus = 0; //0 = close; 1 = open
//課程選單 關或開
let classTableStatus = 0;

//開關主選單
function openCloseMenu(){
    if(document.getElementById('menu').getAttribute('style') != 'display: none'){
        document.getElementById("menuBtn").innerHTML = "<i class='fa fa-bars' aria-hidden='true'></i>";
        document.getElementById("menu").setAttribute('style', 'display: none');
        menuStatus = 0;
    }else{
        document.getElementById("menuBtn").innerHTML = "<i class='fa fa-minus' aria-hidden='true'></i>";
        document.getElementById("menu").setAttribute('style', 'display: block');
        menuStatus = 1;
    }
}

//開關課程選單
function openCloseClass(){
    if(classTableStatus){
        document.getElementById("tableBox").setAttribute('style', 'display: none');
        document.getElementById("openCloseClass").innerText = "顯示課程";
        classTableStatus = 0;
    }else{
        document.getElementById("tableBox").setAttribute('style', 'display: block');
        document.getElementById("openCloseClass").innerText = "關閉課程";
        classTableStatus = 1;
    }
}
function switchToClass(){
    document.getElementById("classTableWrapper").setAttribute('style', 'display: block');
    document.getElementById("switchClassBtn").setAttribute('style', 'background-color: antiquewhite');
    document.getElementById("timeTableWrapper").setAttribute('style', 'display: none');
    document.getElementById("switchTimeBtn").setAttribute('style', 'background-color: white');
}
function switchToTime(){
    document.getElementById("classTableWrapper").setAttribute('style', 'display: none');
    document.getElementById("switchClassBtn").setAttribute('style', 'background-color: white');
    document.getElementById("timeTableWrapper").setAttribute('style', 'display: block');
    document.getElementById("switchTimeBtn").setAttribute('style', 'background-color: antiquewhite');
}

//開啟鳳梨課表分頁
function pineapple(){
    window.open("https://ccuclass.com/#/main", "_blank");
}

function closeRouting(){
    if(routing != null){
        map.removeControl(routing);
        routing = null;
    }
    if(routeStart.btnStatus != null){
        routeStart.btnStatus.setAttribute('class', 'classTableIdxBtn');
    }
    if(routeEnd.btnStatus != null){
        routeEnd.btnStatus.setAttribute('class', 'classTableIdxBtn');
    }
    if(routeStart.marker != null){
        routeStart.marker.setIcon(iconBlue);
    }
    if(routeEnd.marker != null){
        routeEnd.marker.setIcon(iconBlue);
    }
    routeStart.index = routeEnd.index = routeStart.btnStatus = routeStart.LatLng = routeEnd.btnStatus = routeEnd.LatLng = routeStart.marker = routeEnd.marker = null;
}

function addcourse(courseID, input, mode){
    let txtValue="";
    var buildingname=course[courseID]['上課地點'];
    for (var i=0;i<buildingname.length;i++){
        if(buildingname[i]>='0'&&buildingname[i]<='9')
            break;
        else
            txtValue+=buildingname[i];
    }
    //alert(txtValue);
    let flag = 1;
    //alert(txtValue);
    var used=0;
    for(var i=0;i<building.length;i++){
        if(txtValue===building[i].name){
            for(let j = 0; j < addedCourse.length; j++){
                if(course[courseID].index == addedCourse[j].index){
                    alert("加入失敗 (已在課程表內)");
                    flag = 0;
                }
            }if(flag){
                addedCourse.push(course[courseID]);
                createMarker(course[courseID],building[i].latitude,building[i].longitude, mode);
            }
            used=1;
        }
    }
    if(used==0)
        alert("Not found");
    else
        document.getElementsByClassName("height_max")[0].setAttribute('style', 'display: none');
    input.value = "";
}

function filterFunction(){
    var input, filter;
    //console.log(document.getElementById("myInput"));
    input = document.getElementById("myInput");
    var insertpos=document.getElementById("dropdowndata");
    insertpos.innerHTML="";
    filter = input.value.toUpperCase();
    if(filter!=""){
        //alert(filter);
        //console.log(document.getElementsByClassName("height_max")[0].style);
        var count=0;
        for(var i=0;i<course.length;i++){
            let txtvalue=course[i]['科目名稱'];
            if (txtvalue.toUpperCase().indexOf(filter) > -1) {
            //alert(building[i].name);
            let btn = document.createElement('button');
            btn.id = course[i].index;
            btn.innerText = course[i]['科目名稱'] +'\n' + course[i]['任課教授'] + ' ' + course[i]['上課時間'];
            //console.log(btn.id)
            btn.onclick = function(){addcourse(btn.id, input, "normal")};
            insertpos.appendChild(btn);
            //insertpos.innerHTML+="<button id="+course[i].index+">"+course[i].SubjectName+"</button>";
            //insertpos.onclick = function(){addcourse(course[i].index)}
            count=count+1;
            }
        }
        if(count!=0){
            document.getElementsByClassName("height_max")[0].setAttribute('style', 'display: block');
        }
        else{
            document.getElementsByClassName("height_max")[0].setAttribute('style', 'display: none');
        }
    }
    else{
        document.getElementsByClassName("height_max")[0].setAttribute('style', 'display: none');
    }
}



function timeFromCharToInt(c){
    if(!isNaN(c)){
        return [parseInt(c)-1, 0, 4]; //開始小時, 開始刻, 時長(刻)
    }else{
        c = c.charCodeAt(0) - 65;
        return [parseInt((c*6+1)/4), (c*6+1)%4, 5];
    }
}

function timeFromStrToChar(obj){
    let daySplit = obj['上課時間'].split(' ');
    let allSplit = [];
    daySplit.forEach(day => {
        let timeSplit = day.split(',');
        let firstSplit = [timeSplit[0].substring(0, 1), timeSplit[0].substring(1)];
        timeSplit.shift();
        timeSplit.unshift(firstSplit[0], firstSplit[1]);
        allSplit.push(timeSplit);
    });
    return allSplit;
}

function getTimeRoutePos(preTxtValue, nowTxtValue){
    closeRouting();
    for(var i=0;i<building.length;i++){
        var preBuliding="";
        for(var j=0;j<preTxtValue['上課地點'].length;j++)
            if('0'<=preTxtValue['上課地點'][j]&&preTxtValue['上課地點'][j]<='9')
                break;
            else 
                preBuliding+=preTxtValue['上課地點'][j];
        var nowBuilding="";
        for(var j=0;j<nowTxtValue['上課地點'].length;j++)
            if('0'<=nowTxtValue['上課地點'][j]&&nowTxtValue['上課地點'][j]<='9')
                break;
            else 
                nowBuilding+=nowTxtValue['上課地點'][j];
        if(preBuliding===building[i].name){
            routeStart.LatLng = {lat: building[i].latitude, lng: building[i].longitude};
            routeStart.index = preTxtValue.index;
        }
        if(nowBuilding===building[i].name){
            routeEnd.LatLng = {lat: building[i].latitude, lng: building[i].longitude};
            routeEnd.index = nowTxtValue.index;
        }
    }allMarkerArr.forEach(e => {
        if(e.index == preTxtValue.index){
            e.marker.setIcon(iconGreen);
            routeStart.marker = e.marker;
        }if(e.index == nowTxtValue.index){
            e.marker.setIcon(iconRed);
            routeEnd.marker = e.marker;
        }
    });
    setRoutingMachine();
}

function sortShowTimeTable(){
    for(let i = 0; i < 6; i++){
        while (document.getElementById(dayOfWeekEn[i]).children[1]) {
            document.getElementById(dayOfWeekEn[i]).removeChild(document.getElementById(dayOfWeekEn[i]).children[1]);
        }
    }
    let nowDayIdx = -1;
    let prevE;
    credit = 0;
    addedTimeClass.sort((a, b) => (a.cmp[0]-b.cmp[0]||a.cmp[1]-b.cmp[1]||a.cmp[2]-b.cmp[2]))
        .forEach(e => {
            credit += parseInt(e['學分']);
            let hr = document.createElement('button');
            let count = 0;
            if(e.cmp[2] == 0){
                count += 10;
            }
            if(e.cmp[0] != nowDayIdx){
                nowDayIdx = e.cmp[0];
            }else{
                let e1 = JSON.parse(JSON.stringify(prevE));
                let e2 = JSON.parse(JSON.stringify(e));
                hr.onclick = function(){getTimeRoutePos(e1, e2)};
                while(1){
                    if(e2.cmp[2] == 0){
                        e2.cmp[1]--;
                        e2.cmp[2] = 3;
                    }else{
                        e2.cmp[2]--;
                    }if(isSpare[e2.cmp[0]][e2.cmp[1]][e2.cmp[2]] == 0){
                        break;
                    }count += 15;
                }
                if(parseInt(count/60) == '0'){
                    hr.innerHTML = "<div style='position: relative;left: 10px'>"+parseInt(count%60)+'min</div>';
                }else{
                    hr.innerHTML = "<div style='position: relative;left: 10px'>"+parseInt(count/60)+'hr'+parseInt(count%60)+'min</div>';
                }
            }
            let div_hr = document.createElement('div');
            hr.setAttribute('class', 'col-hr');
            div_hr.appendChild(hr);
            div_hr.setAttribute('class', 'inner-hr');
            document.getElementById(dayOfWeekEn[nowDayIdx]).appendChild(div_hr);
            let div = document.createElement('div');
            var coursetimesplit=e['上課時間'].split(' '),needed;
            for(var k=0;k<coursetimesplit.length;k++)
                if(coursetimesplit[k][0]==numtoday[nowDayIdx]){
                    needed=coursetimesplit[k];
                    break;
                }
            div.innerText = e['科目名稱'].split(/['\n'' ']/)[0] + '\n' +needed;
            //alert(numtoday[nowDayIdx]);
            div.setAttribute('class', 'inner');
            document.getElementById(dayOfWeekEn[nowDayIdx]).appendChild(div);
            prevE = JSON.parse(JSON.stringify(e));
        });

    for(let i = 0; i < addedTimeClass.length; i++){
        for(let j = i+1; j < addedTimeClass.length; j++){
            if(addedTimeClass[i].index == addedTimeClass[j].index){
                credit -= addedTimeClass[i]['學分'];
                break;
            }
        }
    }
    document.getElementById('credit').innerText = "目前學分: "+parseInt(credit);
}

function updateSpare(obj){
    let allSplit = timeFromStrToChar(obj);
    let spareTime = [];
    let flag = 0;
    allSplit.forEach(daySplitSplit => {
        for(let i = 1; i < daySplitSplit.length; i++){
            let timePass = timeFromCharToInt(daySplitSplit[i]);
            for(let j = 0; j < timePass[2]; j++){
                if(timePass[1] >= 4){
                    timePass[0]++;
                    timePass[1] = 0;
                }
                if(!isSpare[dayOfWeekCh[daySplitSplit[0]]][timePass[0]][timePass[1]]){
                    flag = 1;
                }spareTime.push([dayOfWeekCh[daySplitSplit[0]],timePass[0],timePass[1]]);
                timePass[1]++;
            }
        }
    });
    if(flag){
        return 0;
    }
    spareTime.forEach(e => isSpare[e[0]][e[1]][e[2]] = 0);
    let returnArr = [];
    let tmp = spareTime[0][0];
    returnArr.push(spareTime[0]);
    spareTime.forEach(e => {
        if(e[0] != tmp){
            returnArr.push(e);
            tmp = e[0];
        }
    });
    return returnArr;
}

function restoreSpare(obj, row, mode){ //delete, time
    if(mode == "time"){
        updateCookieArr(obj.index, 0);
    }
    row.setAttribute('class', 'trConflict');
    row.getElementsByTagName('td')[2].style = 'display: block';
    row.getElementsByTagName('td')[3].style = 'display: none';
    for(let i = 0; i < addedTimeClass.length; i++){
        if(addedTimeClass[i].index == obj.index){
            let allSplit = timeFromStrToChar(obj);
            allSplit.forEach(daySplitSplit => {
                for(let i = 1; i < daySplitSplit.length; i++){
                    let timePass = timeFromCharToInt(daySplitSplit[i]);
                    for(let j = 0; j < timePass[2]; j++){
                        if(timePass[1] >= 4){
                            timePass[0]++;
                            timePass[1] = 0;
                        }
                        isSpare[dayOfWeekCh[daySplitSplit[0]]][timePass[0]][timePass[1]] = 1;
                        timePass[1]++;
                    }
                }
            });
            addedTimeClass.splice(i,1);
            i--;
        }
    }
    sortShowTimeTable();
}

function updateCookieArr(idx, inTime){
    let inArr = 0;
    for(let i = 0; i < addedCourseIdx.length; i++){
        if(idx == addedCourseIdx[i][0]){
            addedCourseIdx[i][1] = inTime;
            inArr = 1;
            break;
        }
    }if(!inArr){
        addedCourseIdx.push([idx,inTime]);
    }
    updateCookie();
}

function appendTimeTable(obj, row){
    let flag = updateSpare(obj);
    if(flag == 0){
        updateCookieArr(obj.index, 0);
        alert(obj['科目名稱'].split(/['\n'' ']/)[0]+"加至時間表失敗 (衝堂)");
        row.setAttribute('class', 'trConflict');
        row.getElementsByTagName('td')[2].style = 'display: block';
        row.getElementsByTagName('td')[3].style = 'display: none';
    }else{
        updateCookieArr(obj.index, 1);
        row.removeAttribute('class');
        row.getElementsByTagName('td')[2].style = 'display: none';
        row.getElementsByTagName('td')[3].style = 'display: block';
        flag.forEach(e => {
            let newObj = JSON.parse(JSON.stringify(obj));
            newObj.cmp = e;
            addedTimeClass.push(newObj);
        });
        sortShowTimeTable();
    }
}


//顯示marker
map.addLayer(markerCluster);

//button判定
document.getElementById("menuBtn").addEventListener("click", openCloseMenu);
document.getElementById("openCloseClass").addEventListener("click", openCloseClass);
document.getElementById("openCloseClass").addEventListener("click", openCloseMenu);
document.getElementById("classTableBtn").addEventListener("click", openCloseClass);
document.getElementById("closeRouting").addEventListener("click", closeRouting);
document.getElementById("closeRouting").addEventListener("click", openCloseMenu);
document.getElementById("pineapple").addEventListener("click", pineapple);
document.getElementById("switchClassBtn").addEventListener("click", switchToClass);
document.getElementById("switchTimeBtn").addEventListener("click", switchToTime);
document.getElementById("myInput").onkeyup = function(){filterFunction()};
