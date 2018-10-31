import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { SimulatedAwgService } from './instruments/simulated-awg.service';
import { SimulatedDcService } from './instruments/simulated-dc.service';
import { SimulatedOscService } from './instruments/simulated-osc.service';
import { SimulatedTriggerService } from './instruments/simulated-trigger.service';
import { SimulatedLaService } from './instruments/simulated-la.service';
import { SimulatedGpioService } from './instruments/simulated-gpio.service';
import { SimulatedLoggerService } from './instruments/simulated-logger.service';

//Services
import { SimulatedDeviceHelperService } from './simulated-device-helper.service';
import { CommandUtilityService } from '../utilities/command-utility.service';

@Injectable()
export class SimulatedDeviceService {

    public streamState: {
        mode: string,
        remainingSamples: number
    };
    public descriptor: any;
    public awg: SimulatedAwgService;
    public dc: SimulatedDcService;
    public la: SimulatedLaService;
    public osc: SimulatedOscService;
    public trigger: SimulatedTriggerService;
    public gpio: SimulatedGpioService;
    public simDevService: SimulatedDeviceHelperService;
    public commandUtilityService: CommandUtilityService;
    public logger: SimulatedLoggerService;

    constructor(enumeration) {
        this.descriptor = enumeration;
        this.commandUtilityService = new CommandUtilityService();
        this.simDevService = new SimulatedDeviceHelperService();
        this.simDevService.setEnumeration(this.descriptor);
        this.awg = new SimulatedAwgService(this.simDevService);
        this.dc = new SimulatedDcService(this.simDevService);
        this.osc = new SimulatedOscService(this.simDevService);
        this.trigger = new SimulatedTriggerService(this.simDevService);
        this.la = new SimulatedLaService(this.simDevService);
        this.gpio = new SimulatedGpioService(this.simDevService);
        this.logger = new SimulatedLoggerService(this.simDevService);
    }

    send(command: any): Observable<any> {
        return Observable.create((observer) => {
            observer.next(this.parseCommand(JSON.parse(command)));
            observer.complete();
        })
    }

    parseCommand(event) {
        let responseObject: any = {};
        let sumStatusCode = 0;
        let binaryDataFlag = 0;
        for (let instrument in event) {
            //create property on response object
            responseObject[instrument] = {};
            if (event[instrument][0] !== undefined && event[instrument][0].command !== undefined) {
                if (instrument === 'device') {
                    responseObject[instrument] = [];
                    let activeIndex = responseObject[instrument].push(this.processCommands(instrument, event[instrument][0], [])) - 1;
                    sumStatusCode += responseObject[instrument][activeIndex].statusCode;
                }
                else {
                    responseObject[instrument] = this.processCommands(instrument, event[instrument][0], []);
                    sumStatusCode += responseObject[instrument].statusCode;
                }

            } else if (typeof event[instrument] === 'object') {
                if (instrument === 'log') {
                    // each channel in the digital/analog object has a command to process
                    let analogObj = event[instrument].analog; // logger has analog/digital channel types
                    responseObject[instrument]['analog'] = {};

                    for (let channel in analogObj) {
                        let commandArray = analogObj[channel];
                        responseObject[instrument].analog[channel] = [];

                        for (let commandObj of commandArray) {
                            let activeIndex = responseObject[instrument].analog[channel].push(this.processCommands(instrument, commandObj, [channel])) - 1;
                            sumStatusCode += responseObject[instrument].analog[channel][activeIndex].statusCode;

                            if (commandObj.command === "read") {
                                binaryDataFlag = 1;
                            }
                        }
                    }

                    return; // skip doing loop2 because it doesn't pertain to the logger 
                }
            }

            for (let channel in event[instrument]) {
                if (event[instrument][channel][0] !== undefined) {
                    //create property on response object 
                    responseObject[instrument][channel] = [];
                    event[instrument][channel].forEach((element, index, array) => {
                        responseObject[instrument][channel].push(this.processCommands(instrument, event[instrument][channel][index], [channel])) - 1;
                        if (element.command === 'read' && instrument !== 'gpio') {
                            binaryDataFlag = 1;
                        }
                    });

                }

            }
        }
        if (binaryDataFlag) {
            return this.processBinaryDataAndSend(responseObject);
        }
        else {
            let response = JSON.stringify(responseObject);
            let buf = new ArrayBuffer(response.length);
            let bufView = new Uint8Array(buf);
            for (let i = 0; i < response.length; i++) {
                bufView[i] = response.charCodeAt(i);
            }
            return bufView.buffer;
        }
    }

    processCommands(instrument: any, commandObject: any, params: any) {
        let command = instrument + commandObject.command;
        switch (command) {
            //---------- Device ----------
            case 'deviceenumerate':
                return this.descriptor;
            case 'devicestorageGetLocations':
                return {
                    command: 'storageGetLocations',
                    statusCode: 0,
                    storageLocations: [],
                    wait: 0
                };

            //---------- AWG ----------            
            case 'awgsetArbitraryWaveform':
                return this.awg.setArbitraryWaveform(params[0]);
            case 'awgsetRegularWaveform':
                return this.awg.setRegularWaveform(params[0], commandObject);
            case 'awgrun':
                return this.awg.run(params[0]);
            case 'awgstop':
                return this.awg.stop(params[0]);

            //---------- DC ----------        
            case 'dcsetVoltage':
                return this.dc.setVoltage(params[0], commandObject.voltage);
            case 'dcgetVoltage':
                return this.dc.getVoltage(params[0]);

            //---------- GPIO ----------        
            case 'gpiowrite':
                return this.gpio.write(params[0], commandObject.value);
            case 'gpioread':
                return this.gpio.read(params[0]);
            case 'gpiosetParameters':
                return this.gpio.setParameters(params[0], commandObject.direction);

            //-------- TRIGGER --------
            case 'triggersetParameters':
                return this.trigger.setParameters(params[0], commandObject.source, commandObject.targets);
            case 'triggersingle':
                return this.trigger.single();
            case 'triggerforceTrigger':
                return this.trigger.forceTrigger();
            case 'triggerstop': 
                return this.trigger.stop();

            //---------- OSC ----------            
            case 'oscsetParameters':
                return this.osc.setParameters(params[0], commandObject);
            case 'oscread':
                return this.osc.read(params[0]);

            //---------- LA ----------            
            case 'lasetParameters':
                return this.la.setParameters(params[0], commandObject);
            case 'laread':
                return this.la.read(params[0]);

            //---------- LOGGER ----------  
            case 'loggetCurrentState':
                return this.logger.getCurrentState(params[0]);
            case 'logstop':
                return this.logger.stop(params[0]);
            case 'logsetParameters':
                return this.logger.setParameters(params[0], commandObject);
            case 'logrun':
                return this.logger.run(params[0]);
            case 'logread':
                return this.logger.read(params[0]);

            default:
                return {
                    statusCode: 1,
                    errorMessage: `${command} not a recognized command`
                };
        }
    }

    processBinaryDataAndSend(commandObject: any) {
        let binaryDataContainer: any = {};
        let binaryOffset = 0;
        for (let instrument in this.trigger.targets) {
            if (instrument === 'osc' && commandObject[instrument] != undefined) {
                binaryDataContainer['osc'] = {};
                for (let channel in commandObject[instrument]) {
                    binaryDataContainer.osc[channel] = commandObject[instrument][channel][0].y;
                    commandObject[instrument][channel][0].binaryOffset = binaryOffset;
                    binaryOffset += commandObject[instrument][channel][0].binaryLength;
                    delete commandObject[instrument][channel][0].y;
                }
            }
            if (instrument === 'la' && commandObject[instrument] != undefined) {
                binaryDataContainer['la'] = {};
                let initialIteration = true;
                for (let channel in commandObject[instrument]) {
                    commandObject[instrument][channel][0].binaryOffset = binaryOffset;
                    if (initialIteration) {
                        initialIteration = false;
                        binaryDataContainer.la[channel] = commandObject[instrument][channel][0].y;
                        binaryOffset += commandObject[instrument][channel][0].binaryLength;
                    }
                    delete commandObject[instrument][channel][0].y;
                }
            }
        }
        
        // note(andrew): if the container is empty then that means the commandObject instrument
        // is the logger, because the trigger doesn't get set when logging, and doesn't
        // ever get 'log' as a target
        if(Object.keys(binaryDataContainer).length === 0 && commandObject["log"] !== undefined) {
            binaryDataContainer["log"] = {};

            for (let channelType in commandObject["log"]) {
                binaryDataContainer.log[channelType] = {};

                for (let channel in commandObject["log"][channelType]) {
                    binaryDataContainer.log[channelType][channel] = commandObject.log[channelType][channel][0].y;
                    commandObject.log[channelType][channel][0].binaryOffset = binaryOffset;
                    binaryOffset += commandObject.log[channelType][channel][0].binaryLength;
                    delete commandObject.log[channelType][channel][0].y;
                }
            }
        }

        let buf = new ArrayBuffer(binaryOffset);
        let bufView = new Uint8Array(buf);
        let binaryInjectorIndex = 0;
        let prevLength = 0;
        for (let instrument in binaryDataContainer) {
            if (instrument === "log") { // handle logger instrument differently
                for (let channelType in binaryDataContainer.log) {
                    for (let channel in binaryDataContainer.log[channelType]) {
                        let unsignedConversion = new Uint8Array(binaryDataContainer.log[channelType][channel].buffer);
                        binaryInjectorIndex += prevLength + unsignedConversion.length;
                        
                        for (let i = prevLength, j = 0; i < binaryInjectorIndex; i = i + 2, j = j + 2) {
                            bufView[i] = unsignedConversion[j];
                            bufView[i + 1] = unsignedConversion[j + 1];
                        }

                        prevLength = unsignedConversion.length;
                    }
                }
            } else {
                for (let channel in binaryDataContainer[instrument]) {
                    let unsignedConversion = new Uint8Array(binaryDataContainer[instrument][channel].buffer);
                    binaryInjectorIndex += prevLength + unsignedConversion.length;
                    for (let i = prevLength, j = 0; i < binaryInjectorIndex; i = i + 2, j = j + 2) {
                        bufView[i] = unsignedConversion[j];
                        bufView[i + 1] = unsignedConversion[j + 1];
                    }
                    prevLength = unsignedConversion.length;
                    if (instrument === 'la') { break; }
                }
            }
        }
        
        return this.commandUtilityService.createChunkedArrayBuffer(commandObject, bufView.buffer).buffer;
    }
}