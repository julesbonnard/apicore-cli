import { table } from '../../../components/table.js'

import { BaseCommand } from '../../../base-command.js'

export default class ListServices extends BaseCommand<typeof ListServices> {
  static description = 'List notifications services'

  async run(): Promise<void> {
    const services = await this.apiCore.notificationCenter.listServices()

    /* eslint-disable perfectionist/sort-objects */
    table(services, {
      serviceName: {
        header: 'Service Name'
      },
      serviceType: {
        header: 'Service Type'
      },
      createdDate: {
        header: 'Created Date'
      },
      lastRegisteredDate: {
        header: 'Last Registered Date'
      },
      shared: {
        header: 'Shared'
      },
      serviceDatas: {
        header: 'Service Data'
      }
    }, {
      printLine: this.log.bind(this)
    })
    /* eslint-enable perfectionist/sort-objects */
  }
}
