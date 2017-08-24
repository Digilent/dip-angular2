import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../../generic-instrument.service';
import { TransportContainerService } from '../../../../transport/transport-container.service';
import { LoggerDigitalChannelService } from './logger-digital-channel.service';
import { LoggerCommandService } from '../logger-command.service';

//Interfaces
import { LoggerInstruments } from '../logger-command.service';

@Injectable()
export class LoggerDigitalInstrumentService extends GenericInstrumentService {

    readonly chans: LoggerDigitalChannelService[] = [];
    readonly numChans: number = 0;
    private loggerCommandService: LoggerCommandService = new LoggerCommandService(this);

    constructor(_transport: TransportContainerService, _loggerInstrumentDescriptor: any) {
        super(_transport, '/');

        //Populate logger digital supply parameters
        this.numChans = _loggerInstrumentDescriptor.numChans;

        //Populate channels        
        for (let key in _loggerInstrumentDescriptor) {
            if (key !== 'numChans') {
                this.chans.push(new LoggerDigitalChannelService(_loggerInstrumentDescriptor[key]));
            }
        }
    }

    setParameters(chans: number[], maxSampleCounts: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[], bitMasks: number[]) {
        return this.loggerCommandService.digitalSetParameters(chans, maxSampleCounts, sampleFreqs, startDelays, overflows, storageLocations, uris, bitMasks);
    }

    run(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.run('digital', chans);
    }

    stop(instrument: LoggerInstruments, chans: number[]): Observable<any> {
        return this.loggerCommandService.stop('digital', chans);
    }

    read(instrument: LoggerInstruments, chans: number[], startIndices: number[], counts: number[]): Observable<any> {
        return this.loggerCommandService.read('digital', chans, startIndices, counts);
    }

    getCurrentState(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.getCurrentState('digital', chans);
    }

}