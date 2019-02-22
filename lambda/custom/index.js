const Alexa = require('ask-sdk-core');
const rp = require('request-promise');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
    || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'GetCurrencyPriceIntent');
  },
  async handle(handlerInput) {
    let { pesos, cents } = await getCurrencyHelper();

    const speechOutput = `El dólar está a ${pesos} pesos y ${cents} centavos. <break time="2s"/> ¿Quieres oírlo de nuevo?`;
    const speechTextReprompt = 'Quieres oírlo de nuevo?, o si necesitas ayuda di: Ayuda';

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechTextReprompt)
      .withSimpleCard('', `El dólar está a ${pesos} pesos y ${cents} centavos`)
      .getResponse();
  },
};

const CustomIntentRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
    && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  async handle(handlerInput) {
    let { pesos, cents } = await getCurrencyHelper();
    const speechOutput = `El dólar está a ${pesos} pesos y ${cents} centavos`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard('', speechOutput)
      .getResponse();
  },
};

async function getCurrencyHelper() {
  let currency = await rp(`https://free.currencyconverterapi.com/api/v6/convert?q=USD_MXN&compact=ultra&apiKey=${process.env.API_KEY}`);
  currency = JSON.parse(currency);
  currency = currency.USD_MXN;
  const currArr = currency.toString().split('.');
  const cents = parseInt(currArr[1].substring(0, 2), 10);

  return {pesos: currArr[0], cents}
}
 
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Puedes pedirme el precio del dólar diciendo múltiples frases como: a cuanto está el dólar?, cuanto está hoy?. Entonces dime, ¿Cómo te puedo ayudar?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('', speechText)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent'
        || request.intent.name === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Adios!')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Lo siento no pude entenderte, intenta de nuevo.')
      .reprompt('Lo siento no pude entenderte, intenta de nuevo.')
      .getResponse();
  },
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`);
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    CustomIntentRequestHandler,
    HelpIntentHandler,
    ExitHandler,
    SessionEndedRequestHandler,
    SystemExceptionHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
