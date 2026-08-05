import * as xb from 'xrblocks';
import {CardManager} from '../../glasses/ui/CardManager';

/** A tool that displays a card with a title and body. */
export class ShowCardTool extends xb.Tool {
  constructor(private cardManager: CardManager) {
    super({
      name: 'showCard',
      description:
        'Displays a card with a title (optional) and body. The body should be a short sentence or a paragraph up to 8 lines if the title is not provided or 6 lines if a title is provided. Each line can have up to 32 characters and words will be automatically wrapped if they do not fit on the same line. The title should be shorter than 20 characters. The text will not scroll on the screen if it overflows so ensure it has the correct number of lines! Use \\n for line breaks.',
      parameters: {
        type: 'OBJECT',
        properties: {
          title: {
            type: 'STRING',
            description: 'The title of the card.',
          },
          body: {
            type: 'STRING',
            description: 'The main content of the card.',
          },
        },
        required: ['body'],
      },
    });
  }

  async execute(args: {title?: string; body: string}): Promise<xb.ToolResult> {
    console.log('Showing card:', args);
    const {cardTitleSignal, cardBodySignal} = this.cardManager.createNewCard();
    cardTitleSignal.value = args.title;
    cardBodySignal.value = args.body;
    return {success: true, data: 'Card displayed.'};
  }
}
