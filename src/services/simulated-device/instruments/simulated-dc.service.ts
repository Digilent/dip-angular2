import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedDcService {
    private simulatedDeviceService: SimulatedDeviceHelperService;
    private voltages: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;

    }

    getVoltage(_chan) {
        return {
            command: 'getVoltage',
            voltage: this.voltages[_chan],
            statusCode: 0,
            wait: 100
        }
    }

    setVoltage(_chan, _voltage) {
        this.voltages[_chan] = _voltage;
        return {
            command: 'setVoltage',
            statusCode: 0,
            wait: 0
        };
    }

}