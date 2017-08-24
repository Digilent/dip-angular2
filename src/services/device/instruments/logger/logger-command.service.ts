import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../generic-instrument.service';

@Injectable()
export class LoggerCommandService {
    private instrumentRef: GenericInstrumentService;

    constructor(_loggerInstrumentRef: GenericInstrumentService) {
        this.instrumentRef = _loggerInstrumentRef;
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
                        "vOffset": vOffsets[index],
                        "sampleFreq": sampleFreqs[index],
                        "startDelay": startDelays[index],
                        "overflow": overflows[index],
                        "storageLocation": storageLocations[index],
                        "uri": uris[index]
                    }
                ]
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
                        "sampleFreq": sampleFreqs[index],
                        "startDelay": startDelays[index],
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
        command.log[instrument] = {};
        chans.forEach((element, index, array) => {
            command.log[instrument][chans[index]] =
                [
                    {
                        command: "getCurrentState"
                    }
                ]
        });
        return command;
    }

    analogSetParameters(chans: number[], maxSampleCounts: number[], gains: number[], vOffsets: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[]): Observable<any> {
        let command = this.analogSetParametersJson(chans, maxSampleCounts, gains, vOffsets, sampleFreqs, startDelays, overflows, storageLocations, uris);
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
            this.instrumentRef.transport.writeRead('/', command, 'binary').subscribe(
                (data) => {
                    console.log(data);
                    observer.next(data);
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

export type LoggerInstruments = 'analog' | 'digital';