import { Injectable } from '@angular/core';

import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedLoggerService {
    private simulatedDeviceService: SimulatedDeviceHelperService;

    // simulated MZ Scope has X channels while an MZ Logger has 8 channels
    private offsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private gains: number[] = [1, 1, 1, 1, 1, 1, 1, 1];
    private sampleFreqs: number[] = [10e6, 10e6, 10e6, 10e6, 10e6, 10e6, 10e6, 10e6];
    private delays: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    private maxSampleCounts: number[] = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];
    private storageLocations: string[] = ["ram", "ram", "ram", "ram", "ram", "ram", "ram", "ram"];
    private uris: string[] = ["", "", "", "", "", "", "", ""];
    private states: string[] = ["stopped", "stopped", "stopped", "stopped", "stopped", "stopped", "stopped", "stopped"];

    private startIndices: number[] = [0, 0, 0, 0, 0, 0, 0, 0]; // note(andrew): populate these values according to the # of channels the device has

    private timeOfLastRead: number[] = [null, null, null, null, null, null, null, null];

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    public getCurrentState(chan: number) {
        --chan; // note: channel is the channel number, not the index of the channel in our arrays. Subtracting one makes it the index.

        return {
            command: 'getCurrentState',
            statusCode: 0,
            state: this.states[chan],
            stopReason: "NORMAL",
            startIndex: this.startIndices[chan],
            actualCount: 0, // number of samples
            maxSampleCount: -1,
            actualGain: this.gains[chan],
            actualVOffset: this.offsets[chan],
            actualSampleFreq: this.sampleFreqs[chan],
            actualStartDelay: this.delays[chan],
            overflow:"circular",
            storageLocation: "",
            uri: "",
            wait: 0
        };
    }

    public setParameters(chan: number, commandObject) {
        --chan;

        let maxSampleCount = this.maxSampleCounts[chan] = commandObject.maxSampleCount;
        let actualGain = this.gains[chan] = commandObject.gain;
        let actualVOffset = this.offsets[chan] = commandObject.vOffset;
        let actualSampleFreq = this.sampleFreqs[chan] = commandObject.sampleFreq;
        let actualStartDelay = this.delays[chan] = commandObject.startDelay;
        let storageLocation = this.storageLocations[chan] = commandObject.storageLocation;
        let uri = this.uris[chan] = commandObject.uri;

        return { 
            command:"setParameters",
            statusCode:0,
            maxSampleCount,
            actualGain,
            actualVOffset,
            actualSampleFreq,
            actualStartDelay,
            storageLocation,
            uri,
            wait:0
        }
    }

    public run(chan: number) {
        --chan;

        this.timeOfLastRead[chan] = Date.now();
        this.states[chan] = "running";
        this.startIndices[chan] = 0;

        return {
            command: "run",
            statusCode: 0,
            wait: -1
        }
    }

    public stop(chan: number) {
        --chan;

        this.states[chan] = "stopped";

        return {
            command: "stop",
            statusCode: 0,
            wait: 0   
        }
    }

    private drawSine(awgSettings, chan) {
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        // grab sample rate from the AWG
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndices[chan];

        let dt = 1e6 / sampleRate;

        let phase = (chan * 90) * (Math.PI / 180); // in radians
        
        let y = [];
        for (let i = 0; i < numSamples; i++) {
            y[i] = (vpp / 2) * Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * i + t0 + phase) + vOffset;
        }
    
        let typedArray = new Int16Array(y);

        return {
            command:"read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset, // I think this should be the offsets for the logger setting??
            actualSampleFreq: 1e6 / dt,
            actualStartDelay:0,
            storageLocation:"ram",
            uri:"",
            y: typedArray,
            wait:0
        }
    }

    drawSquare(awgSettings, chan) {
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        //Set default values 
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndices[chan];
        let dutyCycle = 50;

        let dt = 1e6 / sampleRate;
        let period = 1 / (sigFreq / 1000);
        let phase = chan * (period / 4);

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            if ((dt * (i + t0) + phase) % period < period * (dutyCycle / 100)) {
                y[i] = (vOffset + vpp / 2);
            }
            else {
                y[i] = (vOffset - vpp / 2);
            }
        }

        let typedArray = new Int16Array(y);

        //length is 2x the array length because 2 bytes per entry
        return {
            command: "read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay: 0,
            storageLocation: "ram",
            uri: "",
            y: typedArray,
            wait: 0
        };
    }

    drawTriangle(awgSettings, chan) {
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndices[chan];

        let dt = 1e6 / sampleRate;
        let period = 1 / (sigFreq / 1000);
        let phase = chan * (period / 4);

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            y[i] = ((4 * (vpp / 2)) / period) * (Math.abs(((dt * (i + t0) + phase + 3 * period / 4) % period) - period / 2) - period / 4) + vOffset;
        }

        let typedArray = new Int16Array(y);

        return {
            command: "read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay: 0,
            storageLocation: "ram",
            uri: "",
            y: typedArray,
            wait: 0
        };

    }

    drawSawtooth(awgSettings, chan) { 
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        let sigFreq = awgSettings.signalFreq; //in mHz
        let vpp = awgSettings.vpp; //mV
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = awgSettings.vOffset; //in mV
        let t0 = this.startIndices[chan];

        //Calculate dt - time between data points
        let dt = 1e6 / sampleRate;
        let period = 1 / (sigFreq / 1000);
        let phase = chan * (period / 4);

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            y[i] = (vpp / period) * ((dt * (i + t0) + phase) % period) + vOffset;
        }

        let typedArray = new Int16Array(y);

        return {
            command:"read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay:0,
            storageLocation:"ram",
            uri:"",
            y: typedArray,
            wait:0
        };

    }

    drawDc(awgSettings, chan) {
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = awgSettings.vOffset;

        let dt = 1e6 / sampleRate;

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            y[i] = vOffset;
        }

        let typedArray = new Int16Array(y);

        return {
            command:"read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay:0,
            storageLocation:"ram",
            uri:"",
            y: typedArray,
            wait:0
        };
    }

    private drawDefault(chan: number) {
        var now = Date.now();
        var T = now - this.timeOfLastRead[chan];
        this.timeOfLastRead[chan] = now;
        
        let sampleRate = this.sampleFreqs[chan] || 6.25e9;
        let numSamples = (sampleRate / 1e6) * (T / 1000);
        let vOffset = 0;

        let dt = 1e6 / sampleRate;

        let y = [];
        for (let j = 0; j < numSamples; j++) {
            y[j] = 0;
        }

        let typedArray = new Int16Array(y);

        return {
            command:"read",
            statusCode: 0,
            binaryOffset: 0,
            binaryLength: 2 * typedArray.length,
            actualCount: typedArray.length,
            startIndex: this.startIndices[chan],
            maxSampleCount: this.maxSampleCounts[chan],
            actualGain: this.gains[chan],
            actualVOffset: vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay:0,
            storageLocation:"ram",
            uri:"",
            y: typedArray,
            wait:0
        }
    }

    public read(chan) {
        --chan;

        let awgSettings = this.simulatedDeviceService.getAwgSettings(1);
        console.log("AWG Settings:", awgSettings);
        
        let responseObj;

        switch(awgSettings.signalType) {
            case 'sine':
                responseObj = this.drawSine(awgSettings, chan);
                break;
            case 'triangle':
                responseObj = this.drawTriangle(awgSettings, chan);
                console.log(responseObj);
                break;
            case 'sawtooth':
                responseObj = this.drawSawtooth(awgSettings, chan);
                break;
            case 'square':
                responseObj = this.drawSquare(awgSettings, chan);
                console.log(responseObj);
                break;
            case 'dc':
                responseObj = this.drawDc(awgSettings, chan);
                break;
            default:
                responseObj = this.drawDefault(chan);
                break;
        }
        
        this.startIndices[chan] += responseObj.actualCount;

        return responseObj;
    }
}