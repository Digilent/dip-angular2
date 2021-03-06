import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { GenericInstrumentService } from '../../generic-instrument.service';
import { TransportContainerService } from '../../../../transport/transport-container.service';
import { LoggerDaqChannelService } from './logger-daq-channel.service';
import { LoggerCommandService } from './logger-command.service';

//Interfaces
import { LoggerInstruments } from '../logger-command.service';

@Injectable()
export class LoggerDaqInstrumentService extends GenericInstrumentService {

    readonly chans: LoggerDaqChannelService[] = [];
    readonly numChans: number = 0;
    readonly fileFormat: number = -1;
    readonly fileRevision: number = -1;
    readonly targets: any = {};
    private loggerCommandService: LoggerCommandService = new LoggerCommandService(this);

    constructor(_transport: TransportContainerService, _loggerInstrumentDescriptor: any) {
        super(_transport, '/');

        if (_loggerInstrumentDescriptor == undefined) {
            return;
        }

        this.fileFormat = _loggerInstrumentDescriptor.fileFormat;
        this.fileRevision = _loggerInstrumentDescriptor.fileRevision;
        this.targets = _loggerInstrumentDescriptor.targets[0];

        //Populate logger supply parameters
        this.numChans = _loggerInstrumentDescriptor.numChans;

        //Populate channels        
        for (let key in _loggerInstrumentDescriptor) {
            if (parseInt(key).toString() === key && !isNaN(parseInt(key))) {
                this.chans.push(new LoggerDaqChannelService(_loggerInstrumentDescriptor[key]));
            }
        }
    }

    setParameters(chans: number[], maxSampleCount: number, sampleFreq: number, startDelay: number, storageLocation: string, logOnBoot: boolean, service: string, apiKey: string, uri: string, averages: number[], overflows: Array<'stop' | 'circular'>) {
        return this.loggerCommandService.setParameters(chans, maxSampleCount, sampleFreq, startDelay, storageLocation, logOnBoot, service, apiKey, uri, averages);
    }

    run(instrument: LoggerInstruments, chans: number[]) {
        return this.loggerCommandService.run();
    }

    stop(): Observable<any> {
        return this.loggerCommandService.stop();
    }

    read(instrument: LoggerInstruments, chans: number[], startIndex: number, count: number): Observable<any> {
        return this.loggerCommandService.read(chans, startIndex, count);
    }

    getCurrentState() {
        return this.loggerCommandService.getCurrentState();
    }
}