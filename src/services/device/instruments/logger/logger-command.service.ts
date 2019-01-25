import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../generic-instrument.service';
import { CommandUtilityService } from '../../../utilities/command-utility.service';

@Injectable()
export class LoggerCommandService {
    private instrumentRef: GenericInstrumentService;
    private commandUtilityService: CommandUtilityService;

    constructor(
        _loggerInstrumentRef: GenericInstrumentService
    ) {
        this.instrumentRef = _loggerInstrumentRef;
        this.commandUtilityService = new CommandUtilityService();
    }

    analogSetParametersJson(chans: number[], maxSampleCounts: number[], gains: number[], vOffsets: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[]) {
        let command = {
            "log": {
                "analog": {

                }
            }
        }
        chans.forEach((element, index, array) => {
            command.log.analog[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "maxSampleCount": maxSampleCounts[index],
                        "gain": gains[index],
                        "vOffset": Math.round(vOffsets[index] * 1000),
                        "sampleFreq": Math.round(sampleFreqs[index] * 1000000),
                        "startDelay": Math.round(startDelays[index] * Math.pow(10, 12)),
                        "overflow": overflows[index],
                        "storageLocation": storageLocations[index],
                        "uri": uris[index]
                    }
                ]
        });
        return command;
    }

    daqSetParametersJson(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number, storageLocation: string, uri: string, averages: number[]): string {

        let command: any = {
            "log": {
                "daq": {
                    "command":"setParameters",
                    "maxSampleCount": maxSampleCount,
                    "startDelay": startDelay,
                    "sampleFreq":sampleFreq,
                    "storageLocation": storageLocation,
                    "uri": uri,
                    "channels" : []
                }
            }
        }

        chans.forEach((element, index, array) => {
            let channelSettings: any = {};
            
            channelSettings[chans[index]] = {
                average: averages[index]
            };

            command.log.daq.channels.push(channelSettings);
        });

        return command;
    }

    analogSetParametersParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }
    
    digitalSetParametersParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    runParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    stopParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    digitalSetParametersJson(chans: number[], maxSampleCounts: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[], bitMasks: number[]) {
        let command = {
            "log": {
                "digital": {

                }
            }
        }
        chans.forEach((element, index, array) => {
            command.log.digital[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "bitMask": bitMasks[index],
                        "maxSampleCount": maxSampleCounts[index],
                        "sampleFreq": Math.round(sampleFreqs[index] * 1000000),
                        "startDelay": Math.round(startDelays[index] * Math.pow(10, 12)), //picoseconds
                        "overflow": overflows[index],
                        "storageLocation": storageLocations[index],
                        "uri": uris[index]
                    }
                ]
        });
        return command;
    }

    runJson(instrument: LoggerInstruments, chans: number[]) {
        let command = {
            "log": {}
        }
        command.log[instrument] = {};
        chans.forEach((element, index, array) => {
            command.log[instrument][chans[index]] =
                [
                    {
                        command: "run"
                    }
                ]
        });
        return command;
    }

    stopJson(instrument: LoggerInstruments, chans: number[]) {
        let command = {
            "log": {}
        }
        command.log[instrument] = {};
        chans.forEach((element, index, array) => {
            command.log[instrument][chans[index]] =
                [
                    {
                        command: "stop"
                    }
                ]
        });
        return command;
    }

    readJson(instrument: LoggerInstruments, chans: number[], startIndices: number[], counts: number[]) {
        let command = {
            "log": {}
        }
        command.log[instrument] = {};
        chans.forEach((element, index, array) => {
            command.log[instrument][chans[index]] =
                [
                    {
                        command: "read",
                        startIndex: startIndices[index],
                        count: counts[index]
                    }
                ]
        });
        return command;
    }

    getCurrentStateJson(instrument: LoggerInstruments, chans: number[]) {
        let command = {
            "log": {}
        }

        if (instrument === 'daq') {
            command.log[instrument] = { command: 'getCurrentState' };
        }
        else {
            command.log[instrument] = {};

            chans.forEach((element, index, array) => {
                command.log[instrument][chans[index]] =
                    [
                        {
                            command: "getCurrentState"
                        }
                    ]
            });
        }

        return command;
    }

    analogSetParameters(chans: number[], maxSampleCounts: number[], gains: number[], vOffsets: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[]): Observable<any> {
        let command = this.analogSetParametersJson(chans, maxSampleCounts, gains, vOffsets, sampleFreqs, startDelays, overflows, storageLocations, uris);
        return this.instrumentRef._genericResponseHandler(command);
    }

    daqSetParameters(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number, storageLocation: string, uri: string, averages: number[]): Observable<any> {

        let command = this.daqSetParametersJson(chans, maxSampleCount, sampleFreq, startDelay, storageLocation, uri, averages);

        return this.instrumentRef._genericResponseHandler(command);
    }

    digitalSetParameters(chans: number[], maxSampleCounts: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[], bitMasks: number[]): Observable<any> {
        let command = this.digitalSetParametersJson(chans, maxSampleCounts, sampleFreqs, startDelays, overflows, storageLocations, uris, bitMasks);
        return this.instrumentRef._genericResponseHandler(command);
    }

    run(instrument: LoggerInstruments, chans: number[]): Observable<any> {
        let command = this.runJson(instrument, chans);
        return this.instrumentRef._genericResponseHandler(command);
    }

    stop(instrument: LoggerInstruments, chans: number[]): Observable<any> {
        let command = this.stopJson(instrument, chans);
        return this.instrumentRef._genericResponseHandler(command);
    }

    read(instrument: LoggerInstruments, chans: number[], startIndices: number[], counts: number[]): Observable<any> {
        let command = this.readJson(instrument, chans, startIndices, counts);
        return Observable.create((observer) => {
            this.instrumentRef.transport.writeRead('/', JSON.stringify(command), 'binary')
                .flatMap((data) => {
                    return this.commandUtilityService.observableParseChunkedTransfer(data);
                })
                .subscribe(
                    (data) => {
                        let returnObject = {
                            cmdRespObj: data.json,
                            instruments: {}
                        };

                        let command = data.json;

                        console.log(command);

                        for (let instrument in command.log) {
                            returnObject.instruments[instrument] = {};

                            for (let channel in command.log[instrument]) {
                                returnObject.instruments[instrument][channel] = {};

                                if (command.log[instrument][channel][0].statusCode > 0) {
                                    observer.error('StatusCode error: ' + instrument + ' Ch ' + channel);
                                    return;
                                }

                                if (command.log[instrument][channel][0].binaryLength === 0) {
                                    observer.error('No data received on ' + instrument + ' Ch ' + channel);
                                    return;
                                }

                                let binaryOffset = command.log[instrument][channel][0].binaryOffset / 2;
                                let binaryData = data.typedArray.slice(binaryOffset, binaryOffset + command.log[instrument][channel][0].binaryLength / 2);
                                let untypedArray = Array.prototype.slice.call(binaryData);
                                let scaledArray = untypedArray.map((voltage) => {
                                    return voltage / 1000;
                                });

                                Object.assign(returnObject.instruments[instrument][channel], command.log[instrument][channel][0]);

                                returnObject.instruments[instrument][channel]['data'] = scaledArray;
                            }
                        }
                        observer.next(returnObject);
                        
                        observer.complete();
                    },
                    (err) => {
                        console.log(err);
                        observer.error(err);
                    },
                    () => { } 
                );

        });
    }

    getCurrentState(instrument: LoggerInstruments, chans: number[]) {
        let command = this.getCurrentStateJson(instrument, chans);
        return this.instrumentRef._genericResponseHandler(command);
    }


}

export type LoggerInstruments = 'analog' | 'digital' | 'daq';