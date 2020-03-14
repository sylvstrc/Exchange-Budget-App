let budgetController = (function() {

    calculateTotal = function(type) {
        let sum = 0;
        for (let item of data.allItems[type]){
            sum += item.value;
        }
        data.totals[type] = Math.round(sum*100)/100;
    }

    let data = {
        allItems: {
            exp:[],
            inc:[]
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1,
        currency: '$'
    };

    class Expense {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }

    class Income {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }

    return {
       
        addItem: function(type,desc,val) {
            let newItem, id;
            //create new id
            if (data.allItems[type].length > 0){
            id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                id = 0;
            }
            // create item based on inc or exp
            if (type === 'inc') {
                newItem = new Income(id,desc,val);
            } else {
                newItem = new Expense(id,desc,val);
            }
            //add to data structure
            data.allItems[type].push(newItem);
            return newItem;
        },

        updateList: function(rate, type){
            for (let item of data.allItems[type]) {
                item.value = Math.round((rate* item.value)*100)/100;
            }
        },

        setCurrency: function(newCurr){
            data.currency = newCurr;
        },

        deleteItem: function(type, id){
            let ids = data.allItems[type].map(function(curr){
                return curr.id;
            });
            let index = ids.indexOf(id);
            if (index !== -1) {
                data.allItems[type].splice(index,1);
            }

        },

        calculateBudget: function() {
            //calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');
            //calculate budget
            data.budget = Math.round((data.totals.inc - data.totals.exp) * 100) / 100;
            //calculate percentage of income we spent
            if (data.totals.inc > 0){
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        getBudget: function(){
            return {
                lists: data.allItems,
                budget: data.budget,
                totalIncome: data.totals.inc,
                totalExpense: data.totals.exp,
                percentage: data.percentage,
                currency: data.currency
            };
        },
        testing: function(){
            console.log(data);
        }
    };  
})();

let UIController = (function (){
    let domStrings = {
        inputType: '.add__type',
        inputDesc: '.add__description',
        inputVal: '.add__value',
        addButton: '.add__btn',
        expenseContainer: '.expenses__list',
        incomeContainer: '.income__list',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        budgetLabel: '.budget__value',
        percentageLabel:'.budget__expenses--percentage',
        container: '.container',
        currency: ".currency__type",
        itemValue: 'item__value'
    };
    
    return {
        getInput: function(){
            return {
            type: document.querySelector(domStrings.inputType).value, //Will either be inc or exp
            description: document.querySelector(domStrings.inputDesc).value,
            value: parseFloat(document.querySelector(domStrings.inputVal).value),
            currency: document.querySelector(domStrings.currency).value
            };
        },
        
        getDOMStrings: function() {
            return domStrings;
        },

        updateList: function(data, type){
            let id;
            for (let item of data.lists[type]){
                id = type + '-' + item.id
                let element =  document.getElementById(id);
                element.getElementsByClassName(domStrings.itemValue)[0].innerHTML = data.currency+item.value;
            }
        },

        addListItem:function(obj, type, currency) {
            let html, newHtml,element;
            // create html string with placeholder text
            if (type === 'inc') {
                element = domStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%currency%%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div> </div> </div>';
            }
            else if (type === 'exp') {
                element = domStrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%currency%%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            // replace the placeholder text with some actual data
            newHtml = html.replace('%id%',obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%',obj.value);
            newHtml = newHtml.replace('%currency%', currency);
            // insert the html into the dom
            document.querySelector(element).insertAdjacentHTML('beforeEnd',newHtml);
        },

        deleteListItem: function(id){
            let element = document.getElementById(id);
            element.parentNode.removeChild(element);
        },

        clearFields: function() {
            let fields;
            // returns list 
            fields = document.querySelectorAll(domStrings.inputDesc+', '+domStrings.inputVal);
            let fieldsArray = Array.prototype.slice.call(fields);
            for (let field of fieldsArray) {
                field.value = '';
            }
            fieldsArray[0].focus();
        
        },

        displayBudget: function(obj){
            document.querySelector(domStrings.incomeLabel).textContent = obj.currency+ obj.totalIncome;
            document.querySelector(domStrings.expenseLabel).textContent = obj.currency+ obj.totalExpense;
            document.querySelector(domStrings.budgetLabel).textContent = obj.currency+ obj.budget;
            if (obj.percentage > 0) {
                document.querySelector(domStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(domStrings.percentageLabel).textContent = '---'
            }
        }
    }
    
})();


let controller = (function(budgetCtrl, UICtrl){

    let setupEventListener = function(){
        let DOM = UICtrl.getDOMStrings();
        document.querySelector(DOM.addButton).addEventListener('click', ctrlAddItem);     
        document.addEventListener('keypress', function(event){
            if (event.keyCode === 13){
                ctrlAddItem();
            }
        });
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        document.querySelector(DOM.currency).addEventListener('change', changeCurrency);
    };
                       
    
    let updateBudget = function(){
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();
        // 2. return the budget
        let budget = budgetCtrl.getBudget();
        // 3. Display the budget on the UI
        UIController.displayBudget(budget);

    };

    let changeCurrency = function () {
        // 1. Get New Currency from UI
        let newCurr = UICtrl.getInput().currency;
        // 2. Get currency currently in Data Structure 
        let old = budgetCtrl.getBudget().currency;
        // 3. Convert symbols
        let from = convertSymbols(old);
        let to = convertSymbols(newCurr);
        // 4. Convert exchange rate
        let rate = getRate(from, to).then(rate =>{
            budgetCtrl.updateList(rate, 'inc');
            budgetCtrl.updateList(rate,'exp');
            budgetCtrl.setCurrency(newCurr);
            // get budget
            let budget = budgetCtrl.getBudget();
            // update UI
            UICtrl.updateList(budget, 'inc');
            UICtrl.updateList(budget, 'exp')  
            // Update Budget
            updateBudget();
        });

    }

    async function getRate(from, to) {
        try {
            const result = await fetch(`https://api.exchangeratesapi.io/latest?base=${from}`);
            const data = await result.json();
            const rate = data.rates[to];
            console.log(rate);
            return rate;
        } catch (error){
            console.log(error);
        }
    }

    let convertSymbols = function(symbol){
        if (symbol === '$') {
            return 'USD';
        } else if (symbol === '£'){
            return 'GBP';
        } else {
            return 'EUR';
        }
    }

    let ctrlAddItem = function (){
        // 1. Get the filled input data
        let inputs = UICtrl.getInput();
        if (inputs.description !== '' && !isNaN(inputs.value) && inputs.value > 0){
            // 2. Add the item to the budget controller
            let newItem = budgetCtrl.addItem(inputs.type, inputs.description, inputs.value);
            // 3. Add the item to the UI and clear fields
            UICtrl.addListItem(newItem, inputs.type, inputs.currency);
            UICtrl.clearFields();
            // calculate and update budget
            updateBudget();
        }
    };

    let ctrlDeleteItem = function(event) {
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        console.log(itemID);
        if (itemID) {
            // inc-1
            splitID  = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);
            // 1. Delete item from the data structure
            budgetCtrl.deleteItem(type, id);
            // 2. Delete item from the UI
            UICtrl.deleteListItem(itemID);
            // 3. Update and show the new budget
            updateBudget();
        }
    };
    
    return {
        init: function () {
            console.log('App has started');
            UICtrl.displayBudget({budget: 0,
                totalIncome: 0,
                totalExpense: 0,
                percentage: -1,
                currency: '$'
            })
            setupEventListener();
        }
    };
    
})(budgetController,UIController);

controller.init();


