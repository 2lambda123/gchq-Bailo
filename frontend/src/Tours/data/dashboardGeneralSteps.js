import Joyride, { ACTIONS, EVENTS } from 'react-joyride';

export class App extends React.Component {
  state = {
    run: false,
    steps: [],
  };

  render () {
    const { run, stepIndex, steps } = this.state;

    return (
      <div className="app">
        <Joyride
          run={run}
          steps={steps}
          styles={{
            options: {
              arrowColor: '#e3ffeb',
              backgroundColor: '#e3ffeb',
              overlayColor: 'rgba(79, 26, 0, 0.4)',
              primaryColor: '#000',
              textColor: '#004a14',
              width: 900,
              zIndex: 1000,
            }
          }}
          ...
        />
        ...
      </div>
    );
  }
}