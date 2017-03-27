import { Injectable } from '@angular/core';

//Services
import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedLaService {
    private simulatedDeviceService: SimulatedDeviceHelperService;
    private buffers: number[][] = [];
    private sampleFreqs: number[] = [];
    private bufferSizes: number[] = [];
    private triggerDelays: number[] = [];
    private laDescriptor;

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;
        this.laDescriptor = this.simulatedDeviceService.getEnumeration().la;
        for (let i = 0; i < this.laDescriptor.numChans; i++) {
            this.buffers.push([]);
            this.sampleFreqs.push(0);
            this.bufferSizes.push(0);
            this.triggerDelays.push(0);
        }
    }

    getCurrentState(chan) {
        return {
            command: "getCurrentState",
            statusCode: 0,
            state: "idle",
            acqCount: 0,
            bitmask: 1023,
            actualSampleFreq: this.sampleFreqs[chan],
            actualBufferSize: this.bufferSizes[chan],
            triggerDelay: this.triggerDelays[chan],
            wait: 0
        };
    }

    setParameters(chan, commandObject) {
        this.sampleFreqs[chan] = commandObject.sampleFreq;
        this.bufferSizes[chan] = commandObject.bufferSize;
        this.triggerDelays[chan] = commandObject.triggerDelay;
        this.simulatedDeviceService.setLaParameters(commandObject, chan);
        return {
            "command": "setParameters",
            "statusCode": 0,
            "actualSampleFreq": 6250000000,
            "wait": 0
        };
    }

    read(chan) {
        return this.generateLaData(chan);
    }

    generateLaData(channel: number) {
        let maxBufferSize = Math.max(...this.bufferSizes);
        let typedArray = new Int16Array(maxBufferSize);
        for (let i = 0; i < typedArray.length; i++) {
            typedArray[i] = i;
        }
        return {
            command: "read",
            statusCode: 0,
            wait: 0,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            acqCount: 3,
            bitmask: 1023,
            actualSampleFreq: this.sampleFreqs[channel],
            y: typedArray,
            pointOfInterest: this.bufferSizes[channel] / 2,
            triggerIndex: this.bufferSizes[channel] / 2,
            actualTriggerDelay: this.triggerDelays[channel]
        };
    }


}