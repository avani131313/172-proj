var orderNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {

    if (tableNumber === null) {
      this.askOrderNumber();
    }

    
    var toys = await this.getToys();

    //makerFound Event
    this.el.addEventListener("markerFound", () => {
      if (orderNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });
    //markerLost Event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askOrderNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "Welcome to Toy Shop!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your order number",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false,
    }).then(inputValue => {
      orderNumber = inputValue;
    });
  },

  handleMarkerFound: function (toys, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    // Sunday - Saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

 
    var toy = toys.filter(toy => toy.id === markerId)[0];


    if (toy.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      
      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      
      model.setAttribute("visible", true);

      var infoContainer = document.querySelector(`#main-plane-${toy.id}`);
      infoContainer.setAttribute("visible", true);

      var priceplane = document.querySelector(`#price-plane-${toy.id}`);
      priceplane.setAttribute("visible", true)

      // Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button")
      
      ratingButton.addEventListener("click", function () {
        swal({
          icon: "warning",
          title: "Rate Toy",
          text: "Work In Progress"
        });
      });

      orderButtton.addEventListener("click", () => {
        var oNumber;
        orderNumber <= 9 ? (oNumber = `T0${orderNumber}`) : `T${tableNumber}`;
        this.handleOrder(oNumber, toy);

      

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "Your order will be delivered soon!",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );
      payButton.addEventListener("click",()=>
      this.handlePayment())
      
    
    
    
    
    
    }
  },

  handleOrder: function (oNumber, toy) {
   
    firebase
      .firestore()
      .collection("toys")
      .doc(oNumber)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          //Increasing Current Quantity
          details["current_orders"][toy.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;

        // Updating db
        firebase
          .firestore()
          .collection("orders")
          .doc(doc.id)
          .update(details);
      });
  },
  getToys: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  getOrderSummary: async function (oNumber) {
    return await firebase
      .firestore()
      .collection("orders")
      .doc(oNumber)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function () {

    //Getting Table Number
    var oNumber;
    orderNumber <= 9 ? (oNumber = `T0${orderNumber}`) : `T${orderNumber}`;

    //Getting Order Summary from database
    var orderSummary = await this.getOrderSummary(oNumber);

    //Changing modal div visibility
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Get the table element
    var tableBodyTag = document.getElementById("bill-table-body");

    //Removing old tr(table row) data
    tableBodyTag.innerHTML = "";

    //Get the cuurent_orders key 
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Create table row
      var tr = document.createElement("tr");

      //Create table cells/columns for ITEM NAME, PRICE, QUANTITY & TOTAL PRICE
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Add HTML content 
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Append cells to the row
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Append row to the table
      tableBodyTag.appendChild(tr);
    });

    
    var totalTr = document.createElement("tr")
    var td1 = document.createElement("td")
    var td2 = document.createElement("td")
    var td3 = document.createElement("td")
    td1.setAttribute("class","no-line")
    td2.setAttribute("class","no-line")
    td3.setAttribute("class","no-line text-center")
    var strongTag = document.createElement("strong")
    strongTag.innerHTML("total")
    td3.appendChild(strongTag)
    var td4 = document.createElement("td")
    td4.innerHTML = "$"+orderSummary.total_bill
    totalTr.appendChild(td1)
    totalTr.appendChild(td2)
    totalTr.appendChild(td3)
    totalTr.appendChild(td4)
    tableBodyTag.appendChild(totalTr)
    
    
    
    
 
  },
  handlePayment: function () {
    document.getElementById("modal-div").style.display = "none"
    var oNumber;
    orderNumber <= 9 ? (oNumber = `T0${orderNumber}`) : `T${orderNumber}`;
    firebase
      .firestore()
      .collection("orders")
      .doc(orderNumber)
      .update({current_orders:{},total_bill:0})
      .then(()=>{
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "We Hope you like the toy !!",
          timer: 2500,
          buttons: false
        });

      })

    
  },
  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
