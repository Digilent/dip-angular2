import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()

export class SimulatedAwgService {
    private simulatedDeviceService: SimulatedDeviceHelperService;
    private signalTypes: string[] = ['', '', '', '', '', '', '', ''];
    private signalFreqs: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vpps: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private vOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;

    }

    setArbitraryWaveform(chan) {
        return {
            statusCode: 0,
            wait: 0
        };
    }

    setRegularWaveform(chan, commandObject) {
        console.log('awg chan: ' + chan);
        this.signalTypes[chan] = commandObject.signalType;
        this.signalFreqs[chan] = commandObject.signalFreq;
        this.vpps[chan] = commandObject.vpp;
        this.vOffsets[chan] = commandObject.vOffset;
        this.simulatedDeviceService.setAwgSettings(commandObject, chan);
        return {
            "command": "setRegularWaveform",
            "statusCode": 0,
            "actualSignalFreq": commandObject.signalFreq,
            "actualVpp": commandObject.vpp,
            "actualVOffset": commandObject.vOffset,
            "wait": 0
        };
    }

    run(chan) {
        this.simulatedDeviceService.setTriggerArmed(true);
        return {
            "command": "run",
            "statusCode": 0,
            "wait": 0
        }
    }

    stop(chan) {
        console.log('stop');
        this.simulatedDeviceService.setTriggerArmed(false);
        return {
            "command": "stop",
            "statusCode": 0,
            "wait": 0
        };
    }
}

