import { Injectable, Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { TransactionLoggingDto } from "../../../../../common/modules/transaction-logging/dto/transaction-logging.dto";
import { TransactionLoggingService } from "../../../../../common";
import { GeneticAnalysisOrderPaidCommand } from "./genetic-analysis-order-paid.command";

@Injectable()
@CommandHandler(GeneticAnalysisOrderPaidCommand)
export class GeneticAnalysisOrderPaidHandler implements ICommandHandler<GeneticAnalysisOrderPaidCommand> {
  private readonly logger: Logger = new Logger(GeneticAnalysisOrderPaidCommand.name);
  constructor( private readonly loggingService: TransactionLoggingService) {}

  async execute(command: GeneticAnalysisOrderPaidCommand) {
    await this.logger.log('Genetic Analysis Order Paid!');

    const geneticAnalysisOrder = command.geneticAnalysisOrders.humanToGeneticAnalysisOrderListenerData();

    try {
      const isGeneticAnalysisOrderHasBeenInsert =
        await this.loggingService.getLoggingByHashAndStatus(geneticAnalysisOrder.id, 14);
      const geneticAnalysisOrderHistory = await this.loggingService.getLoggingByOrderId(
        geneticAnalysisOrder.id,
      );

      const geneticAnalysisOrderLogging: TransactionLoggingDto = {
        address: geneticAnalysisOrder.customer_id,
        amount: geneticAnalysisOrder.prices[0].value,
        created_at: geneticAnalysisOrder.updated_at,
        currency: geneticAnalysisOrder.currency.toUpperCase(),
        parent_id: BigInt(geneticAnalysisOrderHistory.id),
        ref_number: geneticAnalysisOrder.id,
        transaction_status: 14,
        transaction_type: 3,
      };

      if(!isGeneticAnalysisOrderHasBeenInsert){
        await this.loggingService.create(geneticAnalysisOrderLogging)
      }
    } catch (error) {
      await this.logger.log(error);
    }
  }
}