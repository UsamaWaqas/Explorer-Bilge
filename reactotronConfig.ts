import Reactotron from 'reactotron-react-native';

Reactotron
  .configure({
    name: 'MyApp',
  })
  .useReactNative()
  .connect();

export default Reactotron;