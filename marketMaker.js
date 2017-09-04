const {RippleAPI} = require('ripple-lib');
var sleep = require('sleep')

const api = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public rippled server hosted by Ripple, Inc.
});

var prevOrderVal = [];
var prevOrders = [];
var soldAmount = [];

function ordersRequester(address,orderbook,wait){
	
	return api.getOrderbook(address, orderbook)
			.then((o)=>{return orderLogic(address,o)})
			.then(()=>{return sleep.sleep(wait)})
			.then(()=>{return ordersRequester(address, orderbook,wait)});
};

function orderLogic(address,orderbook){
	//orderLogic provides a promise, which is resolved 
	//at the end of the ripple API call
	return new Promise((resolve,reject) => {
	//Get ask & bid (ask0 & bid0) closest to spot price
	//then calculate where to place orders based on orderOffset
	//percentage. Orders to be made are stored in myOrders.
	//Also, two for loops required below because sometimes returned 
	//orderbook is not ordered from best to worst offer, so have to
	//search orderbookto find best offers
	orderOffset = 0.05;
	buyBackOffset = 0.02;
	if(orderOffset<buyBackOffset){reject()}
	var ask0 = 0;
	var bid0 = 0;
	for(j=0;j<=orderbook.bids.length-1; j++)
	{
		var temp = 1/parseFloat(orderbook.bids[j].properties.makerExchangeRate)
		if(temp >= bid0){bid0 = temp;bidIndex = j}
	}
	for(i=0;i<=orderbook.asks.length-1; i++)
	{
		var temp2 = 1/parseFloat(orderbook.asks[i].properties.makerExchangeRate)
		if(temp2 >= ask0){ask0 = temp2;askIndex = i}
	}
	myOrders = 	{
					"bid": bid0*(1-orderOffset),
				  	"ask": ask0*(1+orderOffset)
		 		}
	console.log(ask0,bid0,orderbook.bids[0],orderbook.asks[0]);

	//get my current orders held on the ripple network
	api.getOrders(address).then(orders =>
	{	
		//order object that will be submitted to network
		var orderObj = {};
	  	for(i=0;i<=orders.length-1;i++)
	  	{
	  		for(j=0;j<=prevOrders.length-1;j++){
	  			condition = prevOrders[j].properties.sequence == orders[i].properties.sequence;		
	  			if(condition)
  				{	//cancel the order

  					// orderCanceller(orders[i]);

  					// Calc size of orders that went through
					soldAmount = orders[i].specification.quantity.value - prevOrders[j].specification.quantity.value;
					// build order object from returned current orders
		  			// (orders=[{specification,properties}]) that will be 
					// submitted to network,  but remove properties attribute
					orderObj = orders[i].specification;
					// If anything sold, update value of previous order still on the books
					orderObj.quantity.value = orderObj.quantity.value-soldAmount;
					// Calculate where to place the orders
					if(orderObj.direction == "buy"){	
						orderObj.totalPrice.value = orderObj.quantity.value/myOrders.ask;//***********!!!!!!!!!!
					} else{
						orderObj.totalPrice.value = orderObj.quantity.value*myOrders.bid;
					}

					// orderPlacer(orderObj,myOrders);
					// if any of the order went through, prepare object to resell back again
					if(soldAmount>0){
					// Build object so that if order that went through was a "sell", 
					// prepare a "buy" and vice versa 
						if(orders.direction=="buy")
						{	orderObj.direction = "sell"}
						else
						{	orderObj.direction = "buy"}
						if(orderObj.direction == "buy"){	
							orderObj.totalPrice.value = orderObj.quantity.value/(ask0*(1+buyBackOffset));//***********!!!!!!!!!!
						} else{
							orderObj.totalPrice.value = orderObj.quantity.value*(ask0*(1-buyBackOffset));
						}
					}
  				}
	  		}
	  	}
	  	prevOrders=orders;
	}).then(()=>{resolve()});
		//orderPlacer(address,price)
	});
}

function orderPlacer(address,price,direction){
	const order = {
	  "direction": direction,
	  "quantity": {
	    "currency": "USD",
	    "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM",
	    "value": "10.1"
	  },
	  "totalPrice": {
	    "currency": "XRP",
	    "value": "2"
	  },
	  "passive": true,
	  "fillOrKill": true
	};
	return api.prepareOrder(address, order)
	  .then(prepared => {/* ... */});
}


api.on('error', (errorCode, errorMessage) => {
  console.log(errorCode + ': ' + errorMessage);
});
api.on('connected', () => {
  console.log('connected');
});
api.on('disconnected', (code) => {
  // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
  // will be 1000 if this was normal closure
  console.log('disconnected, code:', code);
});
api.connect().then(() => {


	
		const address = 'rUg9NMQUN4hAcFNzbs32LNuEtdpV8j7FfZ';
		const orderbook = {
		  "base": {
		    "currency": "XRP",
		    
		  //rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B BITSTAMP
		  //rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y RIPPLECHINA
		  //rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq GATEHUB
		  },
		  "counter": {
		    "currency": "USD",
		"counterparty": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"}
		};
		const wait = 1; 
		a = ordersRequester(address, orderbook,wait);


})

// .then(() => {
//   return api.disconnect();
// }).catch(console.error);