import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../../generic-instrument.service';
import { TransportContainerService } from '../../../../transport/transport-container.service';
import { LoggerAnalogChannelService } from './logger-analog-channel.service';
import { LoggerCommandService } from '../logger-command.service';

//Interfaces
import { LoggerInstruments } from '../logger-command.service';

@Injectable()
export class LoggerAnalogInstrumentService extends GenericInstrumentService {

    readonly chans: LoggerAnalogChannelService[] = [];
    readonly numChans: number = 0;
    readonly fileFormat: number = -1;
    readonly fileRevision: number = -1;
    private loggerCommandService: LoggerCommandService = new LoggerCommandService(this);

    constructor(_transport: TransportContainerService, _loggerInstrumentDescriptor: any) {
        super(_transport, '/');

        if (_loggerInstrumentDescriptor == undefined) {
            return;
        }

        this.fileFormat = _loggerInstrumentDescriptor.fileFormat;
        this.fileRevision = _loggerInstrumentDescriptor.fileRevision;

        //Populate logger analog supply parameters
        this.numChans = _loggerInstrumentDescriptor.numChans;

        //Populate channels        
        for (let key in _loggerInstrumentDescriptor) {
            if (parseInt(key).toString() === key && !isNaN(parseInt(key))) {
                this.chans.push(new LoggerAnalogChannelService(_loggerInstrumentDescriptor[key]));
            }
        }
    }

    setParameters(chans: number[], maxSampleCounts: number[], gains: number[], vOffsets: number[], sampleFreqs: number[], startDelays: number[], overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[]) {
        return this.loggerCommandService.analogSetParameters(chans, maxSampleCounts, gains, vOffsets, sampleFreqs, startDelays, overflows, storageLocations, uris);
    }

    run(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.run('analog', chans);
    }

    stop(instrument: LoggerInstruments, chans: number[]): Observable<any> {
        return this.loggerCommandService.stop('analog', chans);
    }

    read(instrument: LoggerInstruments, chans: number[], startIndices: number[], counts: number[]): Observable<any> {
        return this.loggerCommandService.read('analog', chans, startIndices, counts);
    }

    getCurrentState(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.getCurrentState('analog', chans);
    }
}