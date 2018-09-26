var ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_addr","type":"address"}],"name":"getTickets","outputs":[{"name":"_start","type":"uint256[]"},{"name":"_end","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"executeLottery","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"contributions","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastTicketNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"ticketsMap","outputs":[{"name":"startTicket","type":"uint256"},{"name":"endTicket","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPlayers","outputs":[{"name":"","type":"address[]"},{"name":"","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lastIndex","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"players","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"winner","type":"address"},{"indexed":false,"name":"ticketNumber","type":"uint256"}],"name":"newWinner","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"contributor","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"newContribution","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}];
var Jackpot = web3.eth.contract(ABI).at(contractAddress);
window.PLAYERS = [];

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function buildTable(data) {
  var table = document.createElement("table");
  var thead = document.createElement("thead");
  var tbody = document.createElement("tbody");
  table.className = "table table-striped table-bordered table-hover table-condensed"

  var fields = Object.keys(data[0]);
  var headRow = document.createElement("tr");
  fields.forEach(function(field) {
    var headCell = document.createElement("th");
    headCell.textContent = field;
    headRow.appendChild(headCell);
  });
  thead.appendChild(headRow);

  data.forEach(function(object) {
    var row = document.createElement("tr");
    fields.forEach(function(field) {
      var cell = document.createElement("td");
      cell.textContent = object[field];
      if (typeof object[field] == "number") {
        cell.style.textAlign = "right";
      }
      if (field == "address") {
        cell.innerHTML = "<code>"+cell.textContent+"</code>";
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

function getPlayers() {
  return new Promise(function(resolve, reject) {
    Jackpot.getPlayers(function(e,d) {
      if (e) return reject(e);
      var addrs = d[0], bals = d[1];
      var balance = bals.reduce(function(a,b) {
        return Number(b.add(a).toString(10));
      },0)/1e18;
      window.JackpotBalance = (balance).toFixed(2);
      var array = [];
      addrs.forEach(function(addr,i) {
        var obj = {};
        obj["#"] = String(i+1);
        obj.address = addr;
        obj.contribution = (bals[i]/1e18).toFixed(2);
        obj.percent = (obj.contribution/balance * 100).toFixed(2);
        array.push(obj);
      });
      resolve(PLAYERS = array);
    });
  })
}

function getTickets(address) {
  return new Promise(function(resolve, reject) {
    Jackpot.getTickets(address, function(e, d) {
      if (e) return reject(e);
      var starts = d[0], ends = d[1];
      var array = [];
      starts.forEach(function(ticket, i) {
        var obj = {};
        obj["#from"] = ticket.toString(10);
        obj["#to"] = ends[i].sub(1).toString(10);
        array.push(obj);
      });
      resolve(array);
    })
  })
}

function getMyTickets() {
  return new Promise(function(resolve, reject) {
    web3.eth.getCoinbase(function(e,d) {
      if (e) return reject(e);
      getTickets(d).then(resolve);
    })
  });
}

function contributeETH(ETH) {
  return new Promise(function(resolve, reject) {
    if (web3.eth.coinbase == null) $.alert('Please Login to Metamask');
    web3.eth.sendTransaction({to:contractAddress,value:(new web3.BigNumber(ETH)).mul(1e18),gas:1*1e6,gasPrice:10*1e9},
      function(error, data) {
        if (error) {
           console.log(error.message);
           return reject(error);
        }
        resolve(data);
      });
  });
}


function renderTicketsTable() {
getMyTickets().then(function(tickets) {
  console.log("GOT ", tickets);
  $("#myTickets").html(
    tickets.length?buildTable(tickets)
    : "<h2>No Tickets Yet</h2>")
})
}
web3.version.getNetwork(function(e,d){
  if (e) return;
  window.NETWORK = d;
  $("#contractAddress")
  .html('<a href="https://'+(d=="4"?"rinkeby.":"")+
      "etherscan.io/address/"+contractAddress+'" target="_blank">'+contractAddress+'</a>');

})

$("#contribute-form").submit(function(event) {
  event.preventDefault();
  contributeETH(this.amountOfETH.value).then(console.log);
})

function renderPlayersTable() {
getPlayers().then(function(players) {
  $("#table").html(
    players.length?buildTable(players)
    : "<h2>No Contribution Yet</h2>");
  $("#eth-balance").html(" : " + JackpotBalance + " ETH");
})
}
render();

function render() {
  renderTicketsTable();
  renderPlayersTable();
}

Jackpot.newContribution(function(error, data) {
  if (error) return;
  render();
  console.log(data);
})
Jackpot.newWinner(function(error, data) {
  if (error) return;
  handleNewWinner(data);
})

function handleNewWinner(data) {
  var winner = data.args.winner;
  var ticketNumber = data.args.ticketNumber.toString(10);
  let array = [winner];
  array = array.concat(PLAYERS.map(function(player){return player.address;})
    .filter(function(address){return address != winner;}));
  array.ticket = ticketNumber;
  showLinearSpinner(array);
}




function showSpinner(array) {
  var canvas = document.createElement("canvas");  
  // document.body.appendChild(canvas);
  canvas.width = canvas.height = 500;
  var cx = canvas.getContext("2d");
  var data = array || [0,1,2,3,4,5,6,7,8,9];
  var colors = [ '#ffff00', '#ffc700', '#ff9100', '#ff6301', '#ff0000', '#c6037e',
               '#713697', '#444ea1', '#2772b2', '#0297ba', '#008e5b', '#8ac819' ];
  colors = shuffle(colors)
  var sliceAngle = 2*Math.PI/data.length;
  var startAngle = -Math.PI/2 - 0.3;
  cx.lineWidth = 6;
  cx.arc(canvas.width/2, canvas.height/2, 240, 0, 7);
  cx.stroke();

  for (var i = 0; i < data.length; i++, startAngle += sliceAngle) {
    cx.beginPath();
    cx.fillStyle = colors[i%colors.length];
    console.log(cx.fillStyle);
    cx.arc(canvas.width/2, canvas.height/2, 237, startAngle, startAngle+sliceAngle);
    cx.lineTo(canvas.width/2, canvas.height/2);
    cx.closePath();
    cx.lineWidth = 2;
    cx.stroke();
    cx.fill();
    cx.save();
    cx.font = "14px Arial";
    cx.translate(canvas.width/2,canvas.height/2);
    cx.rotate(startAngle +Math.PI/2 + 0.3);
    cx.fillStyle = "black";
    cx.translate(0,-50);
    cx.rotate(-Math.PI/2);
    cx.textBaseline = "middle";
    cx.fillText(String(data[i]).slice(0,15)+'...',0,0);
    // cx.fillText(String(i), 0, -80);
    cx.restore();
  }
  cx.beginPath();
  cx.arc(canvas.width/2, canvas.height/2, 10, 0, 7);
  cx.fillStyle = "white";
  cx.strokeStyle = "black";
  cx.stroke();
  cx.fill();
  var div = $("<div></div>");
  div.css({position:"relative",overflow:"hidden", padding:0});
  div.append("<span id='pointerSpan'></span>")
  div.append(canvas);
  $.alert({
    useBootstrap:false,
    content:div,
    animateFromElement:false,
    title:"    ",
    boxWidth:"530px",
    onOpenBefore: function () {
        // before the modal is displayed.
        window.alertBox = this;
    },
  });
  setTimeout(function(){
    $(canvas)[0].className = "animatedWheel";
    setTimeout(function(){
      alertBox.setTitle(array && (
        '<a target="_blank" href="https://'+(NETWORK == "4"?"rinkeby.":"") 
        +'etherscan.io/address/'+array[0] + '">'+array[0]+'</a>'
        +" #"+array.ticket) || "LAVI!");
    },8000);
  },50)
}


function showLinearSpinner(addresses){
var addrs = addresses.slice();
var ticket = addresses.ticket;
var winner = addresses[0];
for (var i = 0; i < 5; i++) {
  addresses = addresses.concat(addrs);
}
addresses = shuffle(addresses);
addresses[48] = winner;

var spinnerParent  = $('<div class="spinnerParent"></div>');
var spinner = $('<div class="spinner"></div>');
var spinPointer = $('<div class="spinPointer"></div>');
spinnerParent.append(spinner);
spinnerParent.append(spinPointer);


var colors = [ '#ffff00', '#ffc700', '#ff9100', '#ff6301', '#ff0000', '#c6037e',
               '#713697', '#444ea1', '#2772b2', '#0297ba', '#008e5b', '#8ac819' ];
colors = shuffle(colors);

function box(address, color) {
  var b = $('<div class="box"></div>');
  b.html(address.slice(0,12)+'...');
  // b.css("background",color);
  return b;
}

addresses.forEach(function(address, i) {
  spinner.append(box(address,colors[i%colors.length]));
});

  $.alert({
    useBootstrap:false,
    content:spinnerParent,
    animateFromElement:false,
    title:"    ",
    boxWidth:"530px",
    onOpenBefore: function () {
        // before the modal is displayed.
        window.alertBox = this;
    },
    onContentReady:TIMEOUT
  });

function TIMEOUT(){
  setTimeout(function(){$(".spinner").addClass("animated")},50);
    NETWORK = 4;
    setTimeout(function(){
      alertBox.setTitle((
        '<a target="_blank" href="https://'+(NETWORK == "4"?"rinkeby.":"") 
        +'etherscan.io/address/'+winner + '">'+winner+'</a>'
        +" #"+ticket) || "LAVI!");
    },8000);
}

}
