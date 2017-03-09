import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { LaChannelService } from './la-channel.service';
import { GenericInstrumentService } from '../generic-instrument.service';
import { WaveformService } from '../../../data-types/waveform.service';

//Services
import { TransportService } from '../../../transport/transport.service';
import { CommandUtilityService } from '../../../utilities/command-utility.service';

@Injectable()
export class LaInstrumentService extends GenericInstrumentService {

    public numChans: number;
    public chans: Array<LaChannelService> = [];

    public numDataBuffers = 8;
    public dataBuffer: Array<Array<WaveformService>> = [];
    public dataBufferWriteIndex: number = 0;
    public dataBufferFillSize: number = 0;
    public activeBuffer: string = '0';
    public commandUtilityService: CommandUtilityService;

    constructor(_transport: TransportService, _laInstrumentDescriptor: any) {
        super(_transport, '/')

        //Populate LA supply parameters
        this.numChans = _laInstrumentDescriptor.numChans;
        this.commandUtilityService = new CommandUtilityService();

        //Populate channels  
        for (let channel in _laInstrumentDescriptor) {
            if (channel !== 'numChans') {
                this.chans.push(new LaChannelService(_laInstrumentDescriptor[channel]));
            }
        }

        for (let i = 0; i < this.numDataBuffers; i++) {
            this.dataBuffer.push([]);
        }
    }

    setParametersJson(chans: number[], sampleFreqs: number[], bufferSizes: number[]) {
        let command = {
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "sampleFreq": sampleFreqs[index] * 1000,
                        "bufferSize": bufferSizes[index]
                    }
                ]
        });
        return command;
    }

    setParametersParse(chan, responseObject) {
        return 'Channel ' + chan + ' ' + responseObject.command + ' successful';
    }

    //Tell OpenScope to run once and return a buffer
    setParameters(chans: number[], sampleFreqs: number[], bufferSizes: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "setParameters",
                        "sampleFreq": sampleFreqs[index] * 1000,
                        "bufferSize": bufferSizes[index]
                    }
                ]
        });
        return super._genericResponseHandler(command);
    }

    //Tell OpenScope to run once and return a buffer
    read(chans: number[]): Observable<any> {
        if (chans.length == 0) {
            return Observable.create((observer) => {
                observer.complete();
            });
        }

        let command = {
            "la": {}
        }
        chans.forEach((element, index, array) => {
            command.la[chans[index]] =
                [
                    {
                        "command": "read"
                    }
                ]
        });
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(command), 'json').subscribe(
                (data) => {
                    let start = performance.now();
                    this.commandUtilityService.observableParseChunkedTransfer(data).subscribe(
                        (data) => {
                            let command = data.json;
                            let channelsObject = {};
                            let binaryData = new Int16Array(data.typedArray.slice(command.la[chans[0].toString()][0].binaryOffset, command.la[chans[0].toString()][0].binaryOffset + command.la[chans[0].toString()][0].binaryLength));
                            let untypedArray = Array.prototype.slice.call(binaryData);
                            for (let channel in command.la) {
                                if (command.la[channel][0].statusCode > 0) {
                                    observer.error(command);
                                    return;
                                }
                                channelsObject[channel] = [];

                                let andVal = Math.pow(2, parseInt(channel) - 1);
                                let dt = 1 / (command.la[channel][0].actualSampleFreq / 1000);
                                let pointContainer = [];
                                let triggerPosition = command.la[chans[0]][0].triggerIndex * dt;
                                if (triggerPosition < 0) {
                                    console.log('trigger not in la buffer!');
                                    triggerPosition = command.la[channel][0].triggerDelay;
                                }
                                for (let j = 0; j < untypedArray.length; j++) {
                                    channelsObject[channel].push((andVal & untypedArray[j]) > 0 ? 1 : 0);
                                    pointContainer.push([j * dt - triggerPosition, (andVal & untypedArray[j]) > 0 ? 1 : 0]);
                                }

                                this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel) - 1] = new WaveformService({
                                    dt: 1 / (command.la[channel][0].actualSampleFreq / 1000),
                                    t0: 0,
                                    y: channelsObject[channel],
                                    data: pointContainer,
                                    pointOfInterest: command.la[channel][0].pointOfInterest,
                                    triggerPosition: command.la[channel][0].triggerIndex,
                                    seriesOffset: 0.5
                                });
                            }
                            this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                            if (this.dataBufferFillSize < this.numDataBuffers) {
                                this.dataBufferFillSize++;
                                this.activeBuffer = this.dataBufferFillSize.toString();
                            }
                            else {
                                this.activeBuffer = (this.numDataBuffers).toString();
                            }
                            let finish = performance.now();
                            console.log('Time: ' + (finish - start));
                            console.log(channelsObject);

                            observer.next(command);
                            //Handle device errors and warnings
                            observer.complete();
                        },
                        (err) => {
                            observer.error(data);
                        },
                        () => { }
                    );
                    /*//Handle device errors and warnings
                    let bufferCount = 0;
                    let count = 0;
                    let i = 0;
                    let stringBuffer = '';
                    while (count < 2 && i < 2000) {
                        let char = '';
                        char += String.fromCharCode.apply(null, new Int8Array(data.slice(i, i + 1)));
                        if (char === '\n') {
                            count++;
                        }
                        stringBuffer += char;
                        i++;
                    }
                    if (i === 2000) {
                        console.log(stringBuffer);
                        observer.error('La Read Failed. Try Again');
                        return;
                    }
                    let binaryIndexStringLength = stringBuffer.indexOf('\r\n');
                    let binaryIndex = parseFloat(stringBuffer.substring(0, binaryIndexStringLength));
                    let command;
                    try {
                        command = JSON.parse(stringBuffer.substring(binaryIndexStringLength + 2, binaryIndexStringLength + binaryIndex + 2));
                    }
                    catch (error) {
                        console.log(error);
                        console.log('Error parsing response from read. Printing entire response');
                        console.log(String.fromCharCode.apply(null, new Int8Array(data.slice(0))));
                        observer.error(error);
                        observer.complete();
                        return;
                    }
                    //Holds the info
                    let channelsObject = {};
                    let binaryData = new Int16Array(data.slice(binaryIndexStringLength + 2 + binaryIndex + command.la[chans[0].toString()][0].binaryOffset, binaryIndexStringLength + 2 + binaryIndex + command.la[chans[0].toString()][0].binaryOffset + command.la[chans[0].toString()][0].binaryLength));
                    let untypedArray = Array.prototype.slice.call(binaryData);
                    let start = performance.now();
                    for (let channel in command.la) {
                        if (command.la[channel][0].statusCode > 0) {
                            observer.error(command);
                            return;
                        }
                        channelsObject[channel] = [];

                        let andVal = Math.pow(2, parseInt(channel) - 1);
                        let dt = 1 / (command.la[channel][0].actualSampleFreq / 1000);
                        let pointContainer = [];
                        let triggerPosition = command.la[chans[0]][0].triggerIndex * dt;
                        if (triggerPosition < 0) {
                            console.log('trigger not in la buffer!');
                            triggerPosition = command.la[channel][0].triggerDelay;
                        }
                        for (let j = 0; j < untypedArray.length; j++) {
                            channelsObject[channel].push((andVal & untypedArray[j]) > 0 ? 1 : 0);
                            pointContainer.push([j * dt - triggerPosition, (andVal & untypedArray[j]) > 0 ? 1 : 0]);
                        }

                        this.dataBuffer[this.dataBufferWriteIndex][parseInt(channel) - 1] = new WaveformComponent({
                            dt: 1 / (command.la[channel][0].actualSampleFreq / 1000),
                            t0: 0,
                            y: channelsObject[channel],
                            data: pointContainer,
                            pointOfInterest: command.la[channel][0].pointOfInterest,
                            triggerPosition: command.la[channel][0].triggerIndex,
                            seriesOffset: 0.5
                        });
                        bufferCount++;
                    }
                    this.dataBufferWriteIndex = (this.dataBufferWriteIndex + 1) % this.numDataBuffers;
                    if (this.dataBufferFillSize < this.numDataBuffers) {
                        this.dataBufferFillSize++;
                        this.activeBuffer = this.dataBufferFillSize.toString();
                    }
                    else {
                        this.activeBuffer = (this.numDataBuffers).toString();
                    }
                    let finish = performance.now();
                    console.log('Time: ' + (finish - start));
                    console.log(channelsObject);

                    observer.next(command);
                    //Handle device errors and warnings
                    observer.complete();*/
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }
}
