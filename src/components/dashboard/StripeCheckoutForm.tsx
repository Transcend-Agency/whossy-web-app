import {Elements, PaymentElement} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const StripeCheckoutForm = () => {

    const options = {
        // passing the client secret obtained from the server
        clientSecret: '{{CLIENT_SECRET}}',
      };

  return (
    <Elements stripe={stripePromise} options={options}>
        <form className="flex flex-col gap-y-6">
        <PaymentElement />
        <button>Submit</button>
      </form>
      
      </Elements>
  )
}

export default StripeCheckoutForm