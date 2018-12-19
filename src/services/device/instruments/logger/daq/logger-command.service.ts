import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../../generic-instrument.service';
import { CommandUtilityService } from '../../../../utilities/command-utility.service';

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

    setParametersJson(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number,
                                average: number, storageLocations: string[], uris: string[]): string {

        let command: any = {
            "log": {
                "daq": {
                    "command":"setParameters",
                    "maxSampleCount": maxSampleCount,
                    "startDelay": Math.round(startDelay * Math.pow(10, 12)),
                    "sampleFreq": Math.round(sampleFreq * 1000000),
                    "channels" : []
                }
            }
        }

        chans.forEach((element, index, array) => {
            let channelSettings: any = {};
            
            channelSettings[chans[index]] = {
                average,
                storageLocation: storageLocations[index],
                uri: uris[index]
            };

            command.log.daq.channels.push(channelSettings);
        });

        return command;
    }

    runParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    stopParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    runJson() {
        let command = {
            "log": {
                "daq": {
                    "command": "run"
                }
            }
        };

        return command;
    }

    stopJson() {
        let command = {
            "log": {
                "daq": {
                    "command": "stop"
                }
            }
        }
        
        return command;
    }

    readJson(chans: number[], startIndex: number, count: number = -1) {
        let command = {
            "log": {
                "daq": {
                    "command": "read",
                    "channels": chans,
                    "startIndex": startIndex,
                    "count": count
                }
            }
        }

        return command;
    }

    getCurrentStateJson() {
        let command = {
            "log": {
                "daq": {
                    "command": 'getCurrentState'
                }
            }
        }

        return command;
    }

    setParameters(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number,
        average: number, storageLocations: string[], uris: string[]): Observable<any> {

        let command = this.setParametersJson(chans, maxSampleCount, sampleFreq, startDelay, average,
            storageLocations, uris);

        return this.instrumentRef._genericResponseHandler(command);
    }

    run(): Observable<any> {
        let command = this.runJson();

        return this.instrumentRef._genericResponseHandler(command);
    }

    stop(): Observable<any> {
        let command = this.stopJson();

        return this.instrumentRef._genericResponseHandler(command);
    }

    read(chans: number[], startIndex: number, count: number): Observable<any> {
        let command = this.readJson(chans, startIndex, count);

        return Observable.create((observer) => {
            this.instrumentRef.transport.writeRead('/', JSON.stringify(command), 'binary')
                .flatMap((data) => {
                    return this.commandUtilityService.observableParseChunkedTransfer(data);
                })
                .subscribe(
                    (data: {json: any, typedArray: Int16Array | Uint8Array}) => {
                        let returnObject = {
                            cmdRespObj: data.json,
                            instruments: {}
                        };

                        let command = data.json;

                        console.log(command);

                        for (let instrument in command.log) {
                            returnObject.instruments[instrument] = {};


                            // NO CHANNELS IN THE RESPONSE...
                            for (let channel of command.log[instrument].channels) {
                                returnObject.instruments[instrument][channel] = {};

                                if (command.log[instrument].statusCode > 0) {
                                    observer.error('StatusCode error: ' + instrument + ' Ch ' + channel);
                                    return;
                                }

                                if (command.log[instrument].binaryLength === 0) {
                                    observer.error('No data received on ' + instrument + ' Ch ' + channel);
                                    return;
                                }

                                let binaryOffset = command.log[instrument].binaryOffset / 2; // I am pretty sure that we divide by 2 since we get i16 as the sampleDataType
                                let binaryData = data.typedArray.slice(binaryOffset, binaryOffset + command.log[instrument].binaryLength / 2); // this is what needs to be de-interlaced
                                let untypedArray = Array.prototype.slice.call(binaryData);

                                /*
                                    I need to iterate over the binary data by number of channels to be read & the channels themselves.
                                */

                                console.log('BINARY:', binaryData, untypedArray);

                                let scaledArray = untypedArray.map((voltage) => {
                                    return voltage / 1000;
                                });

                                Object.assign(returnObject.instruments[instrument][channel], command.log[instrument]);

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

    getCurrentState() {
        let command = this.getCurrentStateJson();
        return this.instrumentRef._genericResponseHandler(command);
    }


}

export type LoggerInstruments = 'analog' | 'digital' | 'daq';