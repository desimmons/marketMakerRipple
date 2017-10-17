const {RippleAPI} = require('ripple-lib');
var sleep = require('sleep')

const api = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public rippled server hosted by Ripple, Inc.
});

var prevOrderVal = [];
var reselTag = {};
var prevOrders = [];
var soldAmount = [];
var spotPrice = {};
var counter = 0
var	orderOffset = 0.05;
var buyBackOffset = 0.02;

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
	//percentage. Orders to be made are stored in spotPrice.
	//Also, two for loops required below because sometimes returned 
	//orderbook is not ordered from best to worst offer, so have to
	//search orderbookto find best offers

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
	spotPrice["current"] = 	{
								"bid": bid0,
							  	"ask": ask0
							}

		 		
	// These are prices that orders will be placed
	console.log("Bid price: "+spotPrice.current.bid+"\n"+"Ask price: "+1/spotPrice.current.ask+"\n");
	
	// stop the function on the first round so that it sets itself up
	// with historical transactions
	if(counter==0){counter+=1;
		api.getOrders(address).then(orders =>
		{
			  	prevOrders=orders;
		}).then(()=>{resolve()});
	}
	else{
		console.log(counter)
		counter+=1;

		api.getOrders(address).then(orders =>
		{	
			//order object that will be submitted to network
			var orderObj = {};
	
			//nested forloop required so that we can find 
			//and compare our previous orders with our current orders 
			//to see which went through.
			//This is done on line (I)
			loop1:
		  	for(j=0;j<=prevOrders.length-1;j++)
		  	{
		  		loop2:
		  		for(i=0;i<=orders.length-1;i++){
		  			seqCondition = prevOrders[j].properties.sequence == orders[i].properties.sequence;	//(I)
		  			if(seqCondition)
	  				{	/////////////////////////////////////////
	  					// Manage cancelling of previous orders
	  					/////////////////////////////////////////

	  					if(reselTag[prevOrders[j].properties.sequence] == false){
	  						console.log("\nOrder", prevOrders[j].properties.sequence, "cancelled")
		  					//cancel the order provided it isn't a resell
		  					// orderCanceller(orders[i]);				
		  					delete reselTag[prevOrders[j].properties.sequence]
	  					}
	  					else{
	  						console.log("\nOrder", prevOrders[j].properties.sequence, "not cancelled because it's resell")
	  					}


	  					/////////////////////////////////////////
	  					// Prepare order
	  					/////////////////////////////////////////
	  					// Calc size of orders that went through
						soldAmount = orders[i].specification.quantity.value - prevOrders[j].specification.quantity.value;
						// build order object from returned current orders
			  			// (orders=[{specification,properties}]) that will be 
						// submitted to network, but remove properties attribute
						orderObj = orders[i].specification;
						// If anything sold, update value of previous order still on the books
						orderObj.quantity.value = orderObj.quantity.value-soldAmount;
						// Calculate where to place the orders
						if(orderObj.direction == "buy"){	
							orderObj.totalPrice.value = orderObj.quantity.value/spotPrice.current.ask*(1+orderOffset);//***********!!!!!!!!!!
						} else{
							orderObj.totalPrice.value = orderObj.quantity.value*spotPrice.current.bid*(1-orderOffset);
						}
						instructions = {"maxFee" : null,
										"maxLedgerVersion": null,
										"sequence" : null}
						// reselTag[instructions.sequence] = false;//tag the order as being not a resell


	  					/////////////////////////////////////////
	  					// Place order
	  					/////////////////////////////////////////
	  					// orderPlacer(orderObj,instructions,spotPrice); //submit offset order
						// if any of the order went through, prepare object to resell back again
						if(soldAmount>0){
						// Build object so that if order that went through was a "sell", 
						// prepare a "buy" and vice versa 
							if(orders.direction=="buy")
							{	orderObj.direction = "sell";
								orderObj.totalPrice.value = orderObj.quantity.value*(spotPrice.current.ask*(1-buyBackOffset));
							}
							else
							{	orderObj.direction = "buy";
								orderObj.totalPrice.value = orderObj.quantity.value/(spotPrice.current.bid*(1+buyBackOffset));
							}
							instructions = {"maxFee" : null,
											"maxLedgerVersion": null,
											"sequence" : null}
							// orderPlacer(orderObj,spotPrice); //submit offset order
							// reselTag[instructions.sequence] = true;//tag the order as being a resell
						}
						break loop2; // break inner loop here. Breaking ensures seqCondition = true for lower block of code
	  				}
		  		}

				/////////////////////////////////////////
				// Manage orders that went through entirely
				/////////////////////////////////////////
				// if any of the order went through completely, they will have been missed by the loop
				// above so they need to be resold too. The following if statement checks if the above loop (loop2) missed them.
				if(!seqCondition){//seqCondition will be false iff it was missed by above loops, iff it was completed entirely

				// Build object so that if order that went through was a "sell", 
				// prepare a "buy" and vice versa 
					if(prevOrders.direction=="buy")
					{	prevOrders.direction = "sell";
						prevOrders.totalPrice.value = prevOrders.quantity.value*(spotPrice.prev.ask*(1-buyBackOffset));
					}
					else
					{	prevOrders.direction = "buy";
						prevOrders.totalPrice.value = prevOrders.quantity.value/(spotPrice.prev.bid*(1-buyBackOffset));
					}
					instructions = {"maxFee" : null,
									"maxLedgerVersion": null,
									"sequence" : null}
					// orderCreater(address,orderObj)
					// reselTag = {prevOrders[j].properties.sequence: true;}//tag the order as being a resell
				}

		  	}
			spotPrice["prev"] = spotPrice["current"];
		  	prevOrders=orders;

		}).then(()=>{resolve()});

	}

	//get my current orders held on the ripple network

		//orderPlacer(address,price)
	}
	);
}

function orderCreater(address,orderObj){
	return api.prepareOrder(address, orderObj)
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
		"counterparty": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"}
		};
		const wait = 1; 
		a = ordersRequester(address, orderbook, wait);


})

// .then(() => {
//   return api.disconnect();
// }).catch(console.error);