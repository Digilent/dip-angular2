import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../../generic-instrument.service';
import { TransportContainerService } from '../../../../transport/transport-container.service';
import { LoggerDaqChannelService } from './logger-daq-channel.service';
import { LoggerCommandService } from '../logger-command.service';

//Interfaces
import { LoggerInstruments } from '../logger-command.service';

@Injectable()
export class LoggerDaqInstrumentService extends GenericInstrumentService {

    readonly chans: LoggerDaqChannelService[] = [];
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

        //Populate logger supply parameters
        this.numChans = _loggerInstrumentDescriptor.numChans;

        //Populate channels        
        for (let key in _loggerInstrumentDescriptor) {
            if (parseInt(key).toString() === key && !isNaN(parseInt(key))) {
                this.chans.push(new LoggerDaqChannelService(_loggerInstrumentDescriptor[key]));
            }
        }
    }

    setParameters(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number, average: number, overflows: Array<'stop' | 'circular'>, storageLocations: string[], uris: string[]) {
        return this.loggerCommandService.daqSetParameters(chans, maxSampleCount, sampleFreq, startDelay,
            average, storageLocations, uris);
    }

    run(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.run('daq', chans);
    }

    stop(instrument: LoggerInstruments, chans: number[]): Observable<any> {
        return this.loggerCommandService.stop('daq', chans);
    }

    read(instrument: LoggerInstruments, chans: number[], startIndices: number[], counts: number[]): Observable<any> {
        return this.loggerCommandService.read('daq', chans, startIndices, counts);
    }

    getCurrentState(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.getCurrentState('daq', chans);
    }
}