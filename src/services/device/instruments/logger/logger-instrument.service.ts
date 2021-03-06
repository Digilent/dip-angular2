import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Services
import { LoggerAnalogInstrumentService } from './analog/logger-analog-instrument.service';
import { LoggerDigitalInstrumentService } from './digital/logger-digital-instrument.service';
import { LoggerDaqInstrumentService } from './daq/logger-daq-instrument.service';
import { TransportContainerService } from '../../../transport/transport-container.service';

@Injectable()
export class LoggerInstrumentService {

    readonly analog: LoggerAnalogInstrumentService;
    readonly digital: LoggerDigitalInstrumentService;
    readonly daq: LoggerDaqInstrumentService;

    constructor(_transport: TransportContainerService, _loggerInstrumentDescriptor: any) {
        this.analog = new LoggerAnalogInstrumentService(_transport, _loggerInstrumentDescriptor == undefined ? undefined : _loggerInstrumentDescriptor.analog);
        this.daq = new LoggerDaqInstrumentService(_transport, _loggerInstrumentDescriptor == undefined ? undefined : _loggerInstrumentDescriptor.daq);
        this.digital = new LoggerDigitalInstrumentService(_transport, _loggerInstrumentDescriptor == undefined ? undefined : _loggerInstrumentDescriptor.digital);
    }
}