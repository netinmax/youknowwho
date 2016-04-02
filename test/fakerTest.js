"use strict";

var
    /* NODE internal */
    util                = require('util'),
    EVENTEMITTER        = require('events').EventEmitter,
    faker               = require('faker');

util.inherits(fakeData, EVENTEMITTER);

function fakeData(config, opts) {
    var self = this;

    EVENTEMITTER.call(self, opts);

    self.conditionalOperators = ['&&','||'];

    self.numOperators = ['>','<','>=','<='];

    self.stringOperators = ['datetimerange','!datetimerange','timerange','!timerange']; //TODO: add 'range','!range'

    self.basicOperators = ['+','-','/','*'];

    self.keyOps = ['integer'];//,'dateTimeInput','timeInput']; //rangeInput to be added

    //self.operations = ['numOperators', 'stringOperators'];

    self.actions = ['SET_VARIABLE', 'DANGEROUS_EVAL'];

    self.minRules = 200;

    self.maxRules = 300;

    self.minInputs = 40;

    self.maxInputs = 50;    

    self.minConditions = 5;

    self.maxConditions = 6;

    self.minActions = 2;

    self.maxActions = 3;

    self.randomData = [];

    self.randomRules = [];

    self.ruleConditionMap = {};

    self.ruleActionMap = {};

    self.resultMap = {};

    self.numberOfRules = 0;

    self.numberOfInputs = 0;
}

function getRandomNumber(ops) {
  if(ops && Object.keys(ops).length)
    return faker.random.number(ops);
  else
    return faker.random.number();
}

function getRandomBoolean() {
  return faker.random.boolean();
}

var checked = {};

function getRandomWord() {
  var word = faker.name.firstName() + faker.lorem.word() + String(getRandomNumber()) + faker.name.firstName() + faker.lorem.word() + String(getRandomNumber());
  if(checked[word]) { 
    return getRandomWord();
  } else {
    checked[word] = 1;
    return word;
  }
}

function getRandomArrayElement(arr) {
  if(arr && arr.length)
    return faker.random.arrayElement(arr);
  else 
    return undefined;
}

function getTwoDigits(x)  {
  return x > 9 ? x : 0 + '' + x;
}

function getFullTime(x) {
  var time = x.split(':');
  return (Number(time[0]) * 60 * 60) + (Number(time[1] * 60)) + Number(time[2]);
}

/**
* @returns local time in format YYYY-MM-DD HH:MM:SS
* Removes the GMT/IST markers that give us trouble
* with node-mysql
* @params date
**/
function formatDateTime(d) {
  return [
          d.getFullYear(),
          getTwoDigits(d.getMonth() + 1),
          getTwoDigits(d.getDate())
          ].join('-') + ' ' +
          [
           getTwoDigits(d.getHours()),
           getTwoDigits(d.getMinutes()),
           getTwoDigits(d.getSeconds())
           ].join(':'); 
}

/*
1. no of rules: random
2. for every rule: choose a random conditional operator, choose a random no. of conditions and a no. of actions
3. For every condition, choose an operator.
4. Depending on the type of operator, 
3. [>,<,<=,>=] works on integer input and rest others work on string input
4. 
*/

fakeData.prototype.init = function() {
  var self = this;

  self.setRandomNumberofInput();

  self.generateRandomInput();

  self.setRandomNumberofRules();

  self.generateRandomRules();

  self.generateResults();
  
  return {
    rules: self.randomRules,
    resultMap: self.resultMap,
    messages: self.randomData
  }
};

fakeData.prototype.setRandomNumberofRules = function() {
  var self = this;
  var fakerOps = {
    min: self.minRules,
    max: self.maxRules
  };
  self.numberOfRules = getRandomNumber(fakerOps);
  if (!self.numberOfRules) {
    util.log("[faker] [setRandomNumberofRules] Faker module throwing error!!!");
    process.exit(1);
  }
};

fakeData.prototype.setRandomNumberofInput = function() {
  var self = this;
  
  var fakerOps = {
    min: self.minInputs,
    max: self.maxInputs
  };
  self.numberOfInputs = getRandomNumber(fakerOps);
  if (!self.numberOfInputs) {
    util.log("[faker] [setRandomNumberofInput] Faker module throwing error!!!");
    process.exit(1);
  }
};

fakeData.prototype.generateRandomInput = function() {
  var self = this;
  var numberOfInputs = self.numberOfInputs;
  for(var index = 0; index < numberOfInputs; index++) {
    var message = {};
    message.id = index+1;
    message.integer = getRandomNumber();
    //message.rangeInput = self.getRandomRange(); To be added
    message.dateTimeInput = self.getRandomDateTime().split("~")[0].trim();
    message.timeInput = self.getRandomTime().split("~")[0].trim();
    self.randomData.push(message);
  }
};

fakeData.prototype.getRandomRange = function() {
  return undefined; //TODO: Once we finalize the input for range, we will handle this case.
};

fakeData.prototype.getRandomDateTime = function() {
  // if(!getRandomBoolean()) {
  //   return undefined;
  // }
  var date = new Date();
  var random_min = getRandomNumber();
  var random_max = getRandomNumber({min: random_min});
  var date_min = formatDateTime(new Date(date.getTime() - (24*60*60*1000*random_min)));
  var date_max = formatDateTime(new Date(date.getTime() + (24*60*60*1000*random_max)));
  return date_min + " ~ " + date_max;
};

fakeData.prototype.getRandomTime = function() {
  // if(!getRandomBoolean()) {
  //   return undefined;
  // }
  var hour_ops = {
    min: 0,
    max: 23
  };
  var random_hour_min = getRandomNumber(hour_ops);
  hour_ops.min = random_hour_min;
  var random_hour_max = getRandomNumber(hour_ops);
  return getTwoDigits(random_hour_min) + ":00:00" + " ~ " + getTwoDigits(random_hour_max) + ":00:00";
};

fakeData.prototype.generateRandomRules = function() {
  var self = this;
  var numberOfRules = self.numberOfRules;

  var ruleRandomId = {
    min: 1,
    max: numberOfRules
  };

  var condition_action_Ops = {
    min: self.minConditions,
    max: self.maxConditions
  };

  for(var index = 0; index < numberOfRules; index++) {

    //Rule info
    var rule = {};
    rule.id = getRandomNumber(ruleRandomId);
    rule.name = "Random Test #" + rule.id;
    rule.priority = getRandomNumber();
    rule.conditionsOperator = getRandomArrayElement(self.conditionalOperators);
    
    if(!self.ruleConditionMap[rule.id]) {
      self.ruleConditionMap[rule.id] = {};
    }
    if(!self.ruleActionMap[rule.id]) {
      self.ruleActionMap[rule.id] = {};  
    }

    //Get random number of conditions & actions
    var numberofConditionsActions = getRandomNumber(condition_action_Ops);
  
    for(var condInd = 0; condInd < numberofConditionsActions; condInd++) {
      var rule_condition = self.getRandomCondition();
      var rule_action = self.getRandomAction()
      //Check if same Id condition
      if(!self.ruleConditionMap[rule.id][rule_condition.id]) {
        self.ruleConditionMap[rule.id][rule_condition.id] = rule_condition;
      }
      if(!self.ruleActionMap[rule.id][rule_action.id]) {
        self.ruleActionMap[rule.id][rule_action.id] = rule_action;
      }

      self.randomRules.push({
        rule: rule,
        rule_condition: rule_condition,
        rule_action: rule_action
      });
    }  
  }
};

fakeData.prototype.getRandomCondition = function() {
  var conditionObj = {};
  var self = this;
  var conditionOps = {
    min: self.minConditions,
    max: self.maxConditions
  };
  conditionObj.id = getRandomNumber(conditionOps);
  conditionObj.key = getRandomArrayElement(self.keyOps);
  var operation;
  switch(conditionObj.key) {
    case 'integer': operation = "numOperators";
                    break;
    case 'dateTimeInput': operation = "stringOperators";
                    break;
    case 'timeInput': operation = "stringOperators";
                    break;
  }
  conditionObj.operation = getRandomArrayElement(self[operation]);
  conditionObj.value = String(self.getRandomConditionValue(conditionObj.operation));
  return conditionObj; 
}

fakeData.prototype.getRandomAction = function() {
  var actionObj = {};
  var self = this;
  var actionOps = {
    min: self.minActions,
    max: self.maxActions
  };
  actionObj.id = getRandomNumber(actionOps);
  actionObj.action = 'SET_VARIABLE';//getRandomArrayElement(self.actions);
  actionObj.key = getRandomWord();
  actionObj.value = getRandomNumber();
  return actionObj;
};

fakeData.prototype.getRandomConditionValue = function(operation) {
  var returnValue;
  var self = this;

  switch(operation) {
    case '>':
    case '<':
    case '<=':
    case '>=': returnValue = getRandomNumber();
                break;
    case 'datetimerange':
    case '!datetimerange': returnValue = self.getRandomDateTime();
                          break;
    case 'timerange': 
    case '!timerange': returnValue = self.getRandomTime();
                       break;
  };
  return returnValue;
};

fakeData.prototype.generateResults = function() {
  var self = this;
  var resultMap = {};
  
  var ruleIds = Object.keys(self.ruleConditionMap);
  //console.log("----rule ids are---");
  //console.log(ruleIds);
  for(var index = 0; index < self.numberOfInputs; index++) {
    var data = self.randomData[index];
    var resultHaveProperty = [];
    var resultNotHaveProperty = [];
    var ruleResultMap = {};
    for(var rule_index = 0; rule_index < ruleIds.length; rule_index++) {
      var ruleId = ruleIds[rule_index];
      //console.log("-----ruleId to process------");
      //console.log(ruleId);
      var resCondition = self.applyConditions(data, ruleId);
      //console.log("-------applied Condition for ruleId----" + ruleId);
      //console.log(JSON.stringify(resCondition));
      if(!resCondition) {
        continue;
      }
      
      //Check if action to be applied
      var resAction = self.applyActions(data, ruleId, resCondition);
      //console.log("-----res form action----");
      //console.log(JSON.stringify(resAction)); 
      if(resAction.have_property && resAction.have_property.length) {
        resultHaveProperty = resultHaveProperty.concat(resAction.have_property);
      }
      if(resAction.not_have_property && resAction.not_have_property.length) {
        resultNotHaveProperty = resultNotHaveProperty.concat(resAction.not_have_property);
      }
      ruleResultMap[ruleId] = resCondition;
    }
    
    resultMap[data.id] = {
      metaRules: ruleResultMap,
      have_property: resultHaveProperty && resultHaveProperty.length ? resultHaveProperty : undefined,
      not_have_property: resultNotHaveProperty && resultNotHaveProperty.length ? resultNotHaveProperty : undefined
    };

  }
  self.resultMap = resultMap;
};

fakeData.prototype.applyConditions = function(data, ruleId) {
  var self = this;
  var ruleObj = self.findRule(ruleId);
  if(!ruleObj || !ruleObj.length) {
    return undefined;
  }
  
  var ruleOperator = ruleObj[0].rule.conditionsOperator;
  var tocheck = false; 
  
  switch(ruleOperator) {
    case '&&': tocheck = false;
                break;
    case '||': tocheck = true;
                break; 
  }

  var conditions = self.ruleConditionMap[ruleId];
  if(!conditions || Object.keys(conditions).length === 0) {
    return undefined;
  }

  var ids = Object.keys(self.ruleConditionMap[ruleId]);
  var initial = false;
  var conditionsRes = {};
  for(var index = 0; index < ids.length; index++) {
    var condition = self.ruleConditionMap[ruleId][ids[index]];
    var res = self.processCondition(data, condition);
    conditionsRes[ids[index]] = res;
    if(res === tocheck) {
      initial = res;
      break;
    } 
    if(index === 0) {
      initial = res;
    } else {
      switch(ruleOperator) {
        case '&&': initial = initial && res;
                    break;
        case '||': initial = initial || res;
                    break; 
      }
    }
  }
  return {
    conditions: conditionsRes,
    total_conditions: ids.length,
    applied: initial,
    actions: {},
    total_actions: Object.keys(self.ruleActionMap[ruleId]).length
  };
};

fakeData.prototype.findRule = function(ruleId) {
  return this.randomRules.filter(function(obj) {
    return Number(obj.rule.id) === Number(ruleId);
  });
};

fakeData.prototype.applyActions = function(data, ruleId, resObj) {
  var self = this;
  var property = [];

  var ids = Object.keys(self.ruleActionMap[ruleId]);
  for(var index = 0; index < ids.length; index++) {
    var action = self.ruleActionMap[ruleId][ids[index]];
    var actionObj = {
      key: action.key,
      value: action.value    //Default action as SET_VARIABLE
    };
    if(action.action == 'DANGEROUS_EVAL') {
      actionObj.value = eval(action.value);
    }
    property.push(actionObj);
  }
  
  if(!resObj.applied) {
    return {
      not_have_property: property
    };
  }
  return {
    have_property: property
  };
};

fakeData.prototype.processCondition = function(data, condition) {
  var self = this;

  if(!data[condition.key]) {
    return false;
  }
  switch(condition.operation) {
    case '>': return Number(data[condition.key]) > Number(condition.value);
    case '<': return Number(data[condition.key]) < Number(condition.value);
    case '>=': return Number(data[condition.key]) >= Number(condition.value);
    case '<=': return Number(data[condition.key]) <= Number(condition.value);
    case 'datetimerange': return self.processDateTime(data,condition,true);
    case '!datetimerange': return self.processDateTime(data,condition,false);
    case 'timerange': return self.processTime(data,condition,true);
    case '!timerange': return self.processTime(data,condition,false);
    default: return false;
  }
};

fakeData.prototype.processDateTime = function(data, condition, rangebool) {
  var range = String(condition.value).split('~').map(function(val) {
    return val.trim();
  });
  if(rangebool) {
    return ((new Date(data[condition.key]) >= new Date(range[0])) && (new Date(data[condition.key]) <= new Date(range[1])));
  } else {
    return ((new Date(data[condition.key]) < new Date(range[0])) || (new Date(data[condition.key]) > new Date(range[1])));
  }
};

fakeData.prototype.processTime = function(data, condition, rangebool) {
  var range = String(condition.value).split('~').map(function(val) {
    return val.trim();
  });
  var minTime = getFullTime(range[0]);
  var maxTime = getFullTime(range[1]);
  var val = getFullTime(data[condition.key]);
  if(rangebool) {
    return (val >= minTime && val <= maxTime);
  } else {
    return (val < minTime && val > maxTime); 
  }
};

module.exports = fakeData;

(function () {
   if (require.main == module ) {
    var fake = new fakeData();
    fake.init();
    //console.log(getFullTime("05:00:00"));
    //fake.randomRules = [{"rule":{"id":3,"name":"Random Test #3","priority":18580,"conditionsOperator":"&&"},"rule_condition":{"id":3,"key":"integer","operation":"!timerange","value":"01:00:00"},"rule_action":{"id":2,"action":"SET_VARIABLE","key":"eos","value":43232}},{"rule":{"id":3,"name":"Random Test #3","priority":18580,"conditionsOperator":"&&"},"rule_condition":{"id":3,"key":"integer","operation":"!timerange","value":"01:00:00"},"rule_action":{"id":2,"action":"SET_VARIABLE","key":"eos","value":43232}},{"rule":{"id":2,"name":"Random Test #2","priority":11965,"conditionsOperator":"&&"},"rule_condition":{"id":2,"key":"dateTimeInput","operation":"timerange","value":"10:00:00"},"rule_action":{"id":2,"action":"SET_VARIABLE","key":"illo","value":99651}},{"rule":{"id":2,"name":"Random Test #2","priority":11965,"conditionsOperator":"&&"},"rule_condition":{"id":2,"key":"dateTimeInput","operation":"timerange","value":"10:00:00"},"rule_action":{"id":2,"action":"SET_VARIABLE","key":"illo","value":99651}},{"rule":{"id":2,"name":"Random Test #2","priority":31211,"conditionsOperator":"&&"},"rule_condition":{"id":2,"key":"integer","operation":"timerange","value":"05:00:00"},"rule_action":{"id":3,"action":"SET_VARIABLE","key":"quia","value":39237}},{"rule":{"id":2,"name":"Random Test #2","priority":31211,"conditionsOperator":"&&"},"rule_condition":{"id":2,"key":"integer","operation":"timerange","value":"05:00:00"},"rule_action":{"id":3,"action":"SET_VARIABLE","key":"quia","value":39237}}];
    //console.log(fake.findRule(2));
    //console.log(fake.getRandomTime());
  }
} ());