import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedGpioService {
    private simulatedDeviceService: SimulatedDeviceHelperService;
    private values: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private directions: string[] = ['input', 'input', 'input', 'input', 'input', 'input', 'input', 'input', 'input', 'input'];
    private counter: number = 1;
    private prevChannel: number = -1;

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;

    }

    counterVal(_chan) {
        if (parseInt(_chan) <= this.prevChannel) { this.counter++ }
        this.values[_chan] = (this.counter & Math.pow(2, _chan - 1)) > 0 ? 1 : 0;
        this.prevChannel = parseInt(_chan);
    }

    read(_chan) {
        this.counterVal(_chan);
        return {
            command: 'read',
            value: this.values[_chan],
            direction: this.directions[_chan],
            statusCode: 0,
            wait: 100
        }
    }

    write(_chan, _value) {
        console.log('setting ' + _chan + ' to ' + _value);
        this.values[_chan] = _value;
        return {
            command: 'write',
            statusCode: 0,
            wait: 500
        };
    }

    setParameters(_chan, _direction) {
        console.log('setting ' + _chan + ' to ' + _direction);
        this.values[_chan] = _direction;
        return {
            command: 'setParameters',
            statusCode: 0,
            wait: 100
        };
    }

}