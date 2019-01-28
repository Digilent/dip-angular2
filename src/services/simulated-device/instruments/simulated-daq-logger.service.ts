import { Injectable } from '@angular/core';

import { SimulatedDeviceHelperService } from '../simulated-device-helper.service';

@Injectable()
export class SimulatedDaqLoggerService {
    private simulatedDeviceService: SimulatedDeviceHelperService;

    private sampleFreq: number = 10e8;
    private delay: number = 0;
    private maxSampleCount: number = 1000;
    private averages: number[] = [1, 1, 1, 1, 1, 1, 1, 1];
    private storageLocation: string = "ram";
    private uri: string = "";
    private state: string = "stopped";
    private startIndex: number = 0;
    private timeOfLastRead: number = null;
    private selectedChannels: boolean[] = [true, false, false, false, false, false, false, false];

    constructor(_simulatedDeviceService: SimulatedDeviceHelperService) {
        this.simulatedDeviceService = _simulatedDeviceService;
    }

    public getCurrentState() {
        let channels = [];
        this.selectedChannels.forEach((chan, index) => {
            if (chan) {
                channels.push({
                    [(index + 1).toString()]: {
                        average: this.averages[index]
                    }
                });
            }
        });

        return {
            command: 'getCurrentState',
            statusCode: 0,
            state: this.state,
            stopReason: "NORMAL",
            startIndex: this.startIndex,
            actualCount: 0, // number of samples
            maxSampleCount: -1,
            actualSampleFreq: this.sampleFreq,
            actualStartDelay: this.delay,
            storageLocation: this.storageLocation,
            uri: this.uri,
            channels: channels,
            wait: 0
        };
    }

    public setParameters(commandObject) {
        let maxSampleCount = this.maxSampleCount = commandObject.maxSampleCount;
        let actualSampleFreq = this.sampleFreq = commandObject.sampleFreq;
        let actualStartDelay = this.delay = commandObject.startDelay;
        let storageLocation = this.storageLocation = commandObject.storageLocation;
        let uri = this.uri = commandObject.uri;

        // select channels and set params
        this.selectedChannels = this.selectedChannels.map(() => false);
        commandObject.channels.forEach((chan) => {
            let chanNum = parseInt(Object.keys(chan)[0]);
            this.selectedChannels[chanNum - 1] = true;

            this.averages[chan - 1] = chan[chanNum].average;
        });

        return {
            command: "setParameters",
            statusCode: 0,
            maxSampleCount,
            actualSampleFreq,
            actualStartDelay,
            storageLocation,
            uri,
            channels: commandObject.channels,
            wait: 0
        }
    }

    public run() {
        this.timeOfLastRead = Date.now();
        this.state = "running";
        this.startIndex = 0;

        return {
            command: "run",
            statusCode: 0,
            wait: 0
        }
    }

    public stop() {
        this.state = "stopped";

        return {
            command: "stop",
            statusCode: 0,
            wait: 0
        }
    }

    private drawSine(awgSettings, channels, numSamples, dt) {
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndex;

        let phases = [];
        channels.forEach((chan) => {
            phases.push((chan * 90) * (Math.PI / 180)); // in radians
        });

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < channels.length; j++) {
                y.push((vpp / 2) * Math.sin((2 * Math.PI * (sigFreq / 1000)) * dt * (i + t0) + phases[j]) + vOffset);
            }
        }

        return new Int16Array(y);
    }

    drawSquare(awgSettings, channels, numSamples, dt) {
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndex;
        let dutyCycle = 50;

        let period = 1 / (sigFreq / 1000);
        let phases = [];
        channels.forEach((chan) => {
            phases.push(chan * (period / 4));
        });

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < channels.length; j++) {
                if ((dt * (i + t0) + phases[j]) % period < period * (dutyCycle / 100)) {
                    y.push(vOffset + vpp / 2);
                }
                else {
                    y.push(vOffset - vpp / 2);
                }
            }
        }

        return new Int16Array(y);
    }

    drawTriangle(awgSettings, channels, numSamples, dt) {
        let sigFreq = awgSettings.signalFreq;
        let vpp = awgSettings.vpp;
        let vOffset = awgSettings.vOffset;
        let t0 = this.startIndex;

        let period = 1 / (sigFreq / 1000);
        let phases = [];
        channels.forEach((chan) => {
            phases.push(chan * (period / 4));
        });

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < channels.length; j++) {
                y.push(((4 * (vpp / 2)) / period) * (Math.abs(((dt * (i + t0) + phases[j] + 3 * period / 4) % period) - period / 2) - period / 4) + vOffset);
            }
        }

        return new Int16Array(y);
    }

    drawSawtooth(awgSettings, channels, numSamples, dt) {
        let sigFreq = awgSettings.signalFreq; //in mHz
        let vpp = awgSettings.vpp; //mV
        let vOffset = awgSettings.vOffset; //in mV
        let t0 = this.startIndex;

        let period = 1 / (sigFreq / 1000);
        let phases = [];
        channels.forEach((chan) => {
            phases.push(chan * (period / 4));
        });

        let y = [];
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < channels.length; j++) {
                y.push((vpp / period) * ((dt * (i + t0) + phases[j]) % period) + vOffset);
            }
        }

        return new Int16Array(y);
    }

    drawDc(vOffset, channels, numSamples) {
        let y = [];
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < channels.length; j++) {
                y.push(vOffset);
            }
        }

        return new Int16Array(y);
    }

    private drawDefault(channels, numSamples) {
        let y = [];
        for (let j = 0; j < numSamples; j++) {
            for (let i = 0; i < channels.length; i++) {
                y.push(0);
            }
        }

        return new Int16Array(y);
    }

    public read(commandObject) {
        let awgSettings = this.simulatedDeviceService.getAwgSettings(1);
        let channels = commandObject.channels;

        var now = Date.now();
        var T = now - this.timeOfLastRead;

        let sampleRate = this.sampleFreq || 6.25e9;
        let numSamples = Math.round((sampleRate / 1e6) * (T / 1000));
        if (numSamples > 0) {
            this.timeOfLastRead = now;
        }
        let dt = 1e6 / sampleRate;

        let responseObj = {
            command: "read",
            statusCode: 0,
            channels: channels,
            binaryOffset: 0,
            binaryLength: null,
            actualCount: null,
            startIndex: this.startIndex,
            maxSampleCount: this.maxSampleCount,
            actualGain: 1,
            actualVOffset: awgSettings.vOffset,
            actualSampleFreq: 1e6 / dt,
            actualStartDelay: 0,
            overflow: "circular",
            y: null,
            wait: 0
        };

        let typedArray;

        if (!this.simulatedDeviceService.getTriggerArmed()) {
            typedArray = this.drawDefault(channels, numSamples);
            responseObj.actualVOffset = 0;
        } else {
            switch (awgSettings.signalType) {
                case 'sine':
                    typedArray = this.drawSine(awgSettings, channels, numSamples, dt);
                    break;
                case 'triangle':
                    typedArray = this.drawTriangle(awgSettings, channels, numSamples, dt);
                    break;
                case 'sawtooth':
                    typedArray = this.drawSawtooth(awgSettings, channels, numSamples, dt);
                    break;
                case 'square':
                    typedArray = this.drawSquare(awgSettings, channels, numSamples, dt);
                    break;
                case 'dc':
                    typedArray = this.drawDc(awgSettings.vOffset, channels, numSamples);
                    break;
                default:
                    typedArray = this.drawDefault(channels, numSamples);
                    responseObj.actualVOffset = 0;
                    break;
            }
        }

        responseObj.binaryLength = 2 * typedArray.length;
        responseObj.actualCount = typedArray.length / commandObject.channels.length;
        responseObj.y = typedArray;

        this.startIndex += responseObj.actualCount;
        return responseObj;
    }
}