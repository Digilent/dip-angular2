import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedTriggerService {
    private simulatedDeviceService: SimulatedDeviceHelperService;
    private sources: Array<Object> = [{
        "instrument": null,
        "channel": null,
        "type": null,
        "lowerThreshold": null,
        "upperThreshold": null
    }];
    public targets: Object = {};

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    setParameters(chan, source, targets) {
        this.sources[chan] = source;
        this.targets = targets;
        this.simulatedDeviceService.setTriggerTargets(targets);
        return {
            "command": "setParameters",
            "statusCode": 0,
            "wait": 0
        };
    }

    single() {
        return {
            "command": "single",
            "statusCode": 0,
            "wait": -1,
            "acqCount": 27
        };
    }

    stop() {
        return {
            "command": "stop",
            "statusCode": 0,
            "wait": -1
        }
    }

    forceTrigger() {
        return {
            "command": "forceTrigger",
            "statusCode": 2684354589,
            "wait": -1
        };
    }

}