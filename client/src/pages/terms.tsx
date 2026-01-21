import { useI18n, Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const content: Record<Language, {
  title: string;
  lastUpdated: string;
  back: string;
  copyright: string;
  sections: { title: string; content: React.ReactNode }[];
}> = {
  ru: {
    title: "Условия использования",
    lastUpdated: "Последнее обновление: январь 2026 года",
    back: "Назад",
    copyright: "© 2026 NeuraPix. Все права защищены.",
    sections: [
      {
        title: "1. Преамбула",
        content: (
          <>
            <p>1.1. NeuraPix (далее — «Оператор», «мы», «нас» или «наш») управляет веб-сайтом neurapix.net, представляющим собой онлайн-платформу, предоставляющую услуги обработки и улучшения изображений с использованием искусственного интеллекта (далее — «Сервис»).</p>
            <p>1.2. Настоящие Условия использования («Условия») применяются ко всем пользователям сайта neurapix.net (далее — «Пользователь», «вы» или «ваш»). Получая доступ к Сервису или используя его, вы соглашаетесь соблюдать настоящие Условия.</p>
          </>
        ),
      },
      {
        title: "2. Право использования",
        content: (
          <>
            <h3>2.1. Доступ к платформе</h3>
            <p>Используя Сервис, вы соглашаетесь с тем, что Оператор может временно хранить технические данные, такие как IP-адреса, идентификаторы устройств и журналы использования, в целях обеспечения безопасности, предотвращения злоупотреблений, мониторинга производительности и улучшения качества Сервиса.</p>
            <h3>2.2. Ваш контент</h3>
            <h4>2.2.1. Определение контента</h4>
            <p>«Контент» означает любые изображения, фотографии, тексты, файлы, данные или иные материалы, которые вы загружаете, отправляете, обрабатываете, генерируете или иным образом используете через Сервис.</p>
            <p>Мы оставляем за собой право (но не обязаны) удалять или ограничивать доступ к Контенту, который нарушает настоящие Условия или применимое законодательство.</p>
            <h4>2.2.2. Лицензия на ваш контент</h4>
            <p>Исключительно в целях эксплуатации, поддержки и улучшения Сервиса вы предоставляете Оператору неисключительную, бессрочную, всемирную, безвозмездную лицензию с правом сублицензирования на использование, воспроизведение, изменение, обработку, отображение и распространение вашего Контента в рамках Сервиса.</p>
            <h4>2.2.3. Право собственности</h4>
            <p>Вы сохраняете полное право собственности на ваш Контент. NeuraPix не претендует на право собственности на любой Контент, загруженный или сгенерированный вами.</p>
            <h4>2.2.4. Удаление контента</h4>
            <p>Если вы удаляете Контент из Сервиса, мы прекращаем его активную обработку в разумный срок. Резервные копии могут временно сохраняться по техническим или юридическим причинам.</p>
          </>
        ),
      },
      {
        title: "3. Обязанности пользователя",
        content: (
          <>
            <p>3.1. Пользователь обязуется не:</p>
            <ul>
              <li>вмешиваться в работу Сервиса или его инфраструктуры;</li>
              <li>обходить меры безопасности, лимиты запросов или механизмы контроля доступа;</li>
              <li>загружать вредоносное ПО, вредный код или использовать уязвимости;</li>
              <li>использовать автоматизированные системы с превышением разумных лимитов использования.</li>
            </ul>
            <p>3.2. Вы несёте полную ответственность за то, чтобы ваш Контент не нарушал авторские права, товарные знаки, права на неприкосновенность частной жизни или иные права третьих лиц.</p>
          </>
        ),
      },
      {
        title: "4. Гарантии и ответственность",
        content: (
          <>
            <p>4.1. Сервис предоставляется «как есть» и «по мере доступности», без каких-либо гарантий, явных или подразумеваемых.</p>
            <p>4.2. Мы не гарантируем бесперебойную работу, скорость обработки, точность результатов или сохранность данных.</p>
            <p>4.3. В максимально допустимой законом степени Оператор не несёт ответственности за косвенные, случайные или последующие убытки.</p>
            <p>4.4. Общая ответственность Оператора по настоящим Условиям в любом случае ограничивается суммой 100 (сто) евро.</p>
            <p>4.5. Мы вправе приостановить или прекратить ваш доступ к Сервису в любое время, с уведомлением или без него, в случае нарушения Условий либо прекращения работы Сервиса.</p>
          </>
        ),
      },
      {
        title: "5. Подписки и платежи",
        content: (
          <>
            <p>5.1. Некоторые функции Сервиса могут предоставляться на платной основе. Подписки продлеваются автоматически, если они не были отменены до окончания текущего платёжного периода.</p>
            <p>5.2. Платежи не подлежат возврату, за исключением случаев, прямо предусмотренных применимым законодательством.</p>
            <p>5.3. После отмены подписки вы сохраняете доступ к платным функциям до окончания текущего расчётного периода.</p>
          </>
        ),
      },
      {
        title: "6. Удаление аккаунта",
        content: (
          <>
            <p>Вы можете запросить удаление аккаунта, связавшись с нами по адресу <a href="mailto:support@neurapix.net" className="text-primary hover:underline">support@neurapix.net</a>.</p>
            <p>После подтверждённого запроса мы предпримем разумные меры для удаления ваших персональных данных с учётом требований законодательства о хранении данных.</p>
          </>
        ),
      },
      {
        title: "7. Политика добросовестного использования API",
        content: (
          <>
            <h3>7.1. Доступ к API</h3>
            <p>Использование API NeuraPix подчиняется принципам добросовестного и разумного использования. Ключи API являются персональными и не подлежат передаче третьим лицам.</p>
            <h3>7.2. Запрещённое использование API</h3>
            <p>Запрещается:</p>
            <ul>
              <li>злоупотреблять лимитами запросов;</li>
              <li>осуществлять реверс-инжиниринг или перепродажу API;</li>
              <li>использовать API в незаконных или вредоносных целях.</li>
            </ul>
            <p>Мы оставляем за собой право приостановить или отозвать доступ к API без предварительного уведомления в случае нарушений.</p>
          </>
        ),
      },
      {
        title: "8. Запрещённое использование сервиса",
        content: (
          <>
            <p>Вы соглашаетесь не использовать Сервис для загрузки, генерации или распространения Контента, который:</p>
            <ul>
              <li>является незаконным, мошенническим или вводящим в заблуждение;</li>
              <li>нарушает права интеллектуальной собственности;</li>
              <li>содержит вредоносные программы, спам или оскорбительный материал;</li>
              <li>пропагандирует насилие, ненависть, дискриминацию или эксплуатацию.</li>
            </ul>
          </>
        ),
      },
      {
        title: "9. Функции генеративного ИИ",
        content: (
          <>
            <p>9.1. Сервис может включать инструменты генерации или улучшения изображений с использованием искусственного интеллекта.</p>
            <p>9.2. Все входные данные (Input) и результаты (Output) считаются вашим Контентом.</p>
            <p>9.3. Запрещается использовать функции ИИ для создания или распространения:</p>
            <ul>
              <li>материалов сексуальной эксплуатации детей;</li>
              <li>откровенно сексуального контента;</li>
              <li>контента, пропагандирующего насилие, ненависть или незаконную деятельность;</li>
              <li>попыток обхода механизмов безопасности ИИ.</li>
            </ul>
          </>
        ),
      },
      {
        title: "10. Защита данных",
        content: (
          <p>Вся информация о защите персональных данных и конфиденциальности доступна в нашей <Link href="/privacy" className="text-primary hover:underline">Политике конфиденциальности</Link> на сайте neurapix.net.</p>
        ),
      },
      {
        title: "11. Применимое право и юрисдикция",
        content: (
          <p>Настоящие Условия регулируются и толкуются в соответствии с принципами международного коммерческого права, если иное не предусмотрено императивными нормами местного законодательства.</p>
        ),
      },
      {
        title: "12. Заключительные положения",
        content: (
          <>
            <p>12.1. Если какое-либо положение настоящих Условий будет признано недействительным или неисполнимым, остальные положения сохраняют полную юридическую силу.</p>
            <p>12.2. Мы вправе вносить изменения в настоящие Условия. Продолжение использования Сервиса означает ваше согласие с обновлённой редакцией.</p>
          </>
        ),
      },
    ],
  },
  uk: {
    title: "Умови використання",
    lastUpdated: "Останнє оновлення: січень 2026 року",
    back: "Назад",
    copyright: "© 2026 NeuraPix. Всі права захищені.",
    sections: [
      {
        title: "1. Преамбула",
        content: (
          <>
            <p>1.1. NeuraPix (далі — «Оператор», «ми», «нас» або «наш») керує веб-сайтом neurapix.net, що є онлайн-платформою, яка надає послуги обробки та покращення зображень з використанням штучного інтелекту (далі — «Сервіс»).</p>
            <p>1.2. Ці Умови використання («Умови») застосовуються до всіх користувачів сайту neurapix.net (далі — «Користувач», «ви» або «ваш»). Отримуючи доступ до Сервісу або використовуючи його, ви погоджуєтесь дотримуватись цих Умов.</p>
          </>
        ),
      },
      {
        title: "2. Право використання",
        content: (
          <>
            <h3>2.1. Доступ до платформи</h3>
            <p>Використовуючи Сервіс, ви погоджуєтесь з тим, що Оператор може тимчасово зберігати технічні дані, такі як IP-адреси, ідентифікатори пристроїв та журнали використання, з метою забезпечення безпеки, запобігання зловживанням, моніторингу продуктивності та покращення якості Сервісу.</p>
            <h3>2.2. Ваш контент</h3>
            <h4>2.2.1. Визначення контенту</h4>
            <p>«Контент» означає будь-які зображення, фотографії, тексти, файли, дані або інші матеріали, які ви завантажуєте, надсилаєте, обробляєте, генеруєте або іншим чином використовуєте через Сервіс.</p>
            <p>Ми залишаємо за собою право (але не зобов'язані) видаляти або обмежувати доступ до Контенту, який порушує ці Умови або чинне законодавство.</p>
            <h4>2.2.2. Ліцензія на ваш контент</h4>
            <p>Виключно з метою експлуатації, підтримки та покращення Сервісу ви надаєте Оператору невиключну, безстрокову, всесвітню, безоплатну ліцензію з правом субліцензування на використання, відтворення, зміну, обробку, відображення та розповсюдження вашого Контенту в рамках Сервісу.</p>
            <h4>2.2.3. Право власності</h4>
            <p>Ви зберігаєте повне право власності на ваш Контент. NeuraPix не претендує на право власності на будь-який Контент, завантажений або згенерований вами.</p>
            <h4>2.2.4. Видалення контенту</h4>
            <p>Якщо ви видаляєте Контент із Сервісу, ми припиняємо його активну обробку в розумний строк. Резервні копії можуть тимчасово зберігатися з технічних або юридичних причин.</p>
          </>
        ),
      },
      {
        title: "3. Обов'язки користувача",
        content: (
          <>
            <p>3.1. Користувач зобов'язується не:</p>
            <ul>
              <li>втручатися в роботу Сервісу або його інфраструктури;</li>
              <li>обходити заходи безпеки, ліміти запитів або механізми контролю доступу;</li>
              <li>завантажувати шкідливе ПЗ, шкідливий код або використовувати вразливості;</li>
              <li>використовувати автоматизовані системи з перевищенням розумних лімітів використання.</li>
            </ul>
            <p>3.2. Ви несете повну відповідальність за те, щоб ваш Контент не порушував авторські права, торгові марки, права на недоторканність приватного життя або інші права третіх осіб.</p>
          </>
        ),
      },
      {
        title: "4. Гарантії та відповідальність",
        content: (
          <>
            <p>4.1. Сервіс надається «як є» та «за наявності», без будь-яких гарантій, явних або передбачуваних.</p>
            <p>4.2. Ми не гарантуємо безперебійну роботу, швидкість обробки, точність результатів або збереження даних.</p>
            <p>4.3. В максимально допустимій законом мірі Оператор не несе відповідальності за непрямі, випадкові або наступні збитки.</p>
            <p>4.4. Загальна відповідальність Оператора за цими Умовами в будь-якому випадку обмежується сумою 100 (сто) євро.</p>
            <p>4.5. Ми маємо право призупинити або припинити ваш доступ до Сервісу в будь-який час, з повідомленням або без нього, у разі порушення Умов або припинення роботи Сервісу.</p>
          </>
        ),
      },
      {
        title: "5. Підписки та платежі",
        content: (
          <>
            <p>5.1. Деякі функції Сервісу можуть надаватися на платній основі. Підписки продовжуються автоматично, якщо вони не були скасовані до закінчення поточного платіжного періоду.</p>
            <p>5.2. Платежі не підлягають поверненню, за винятком випадків, прямо передбачених чинним законодавством.</p>
            <p>5.3. Після скасування підписки ви зберігаєте доступ до платних функцій до закінчення поточного розрахункового періоду.</p>
          </>
        ),
      },
      {
        title: "6. Видалення акаунту",
        content: (
          <>
            <p>Ви можете запросити видалення акаунту, зв'язавшись з нами за адресою <a href="mailto:support@neurapix.net" className="text-primary hover:underline">support@neurapix.net</a>.</p>
            <p>Після підтвердженого запиту ми вживемо розумних заходів для видалення ваших персональних даних з урахуванням вимог законодавства про зберігання даних.</p>
          </>
        ),
      },
      {
        title: "7. Політика добросовісного використання API",
        content: (
          <>
            <h3>7.1. Доступ до API</h3>
            <p>Використання API NeuraPix підпорядковується принципам добросовісного та розумного використання. Ключі API є персональними і не підлягають передачі третім особам.</p>
            <h3>7.2. Заборонене використання API</h3>
            <p>Забороняється:</p>
            <ul>
              <li>зловживати лімітами запитів;</li>
              <li>здійснювати зворотну розробку або перепродаж API;</li>
              <li>використовувати API в незаконних або шкідливих цілях.</li>
            </ul>
            <p>Ми залишаємо за собою право призупинити або відкликати доступ до API без попереднього повідомлення у разі порушень.</p>
          </>
        ),
      },
      {
        title: "8. Заборонене використання сервісу",
        content: (
          <>
            <p>Ви погоджуєтесь не використовувати Сервіс для завантаження, генерації або розповсюдження Контенту, який:</p>
            <ul>
              <li>є незаконним, шахрайським або таким, що вводить в оману;</li>
              <li>порушує права інтелектуальної власності;</li>
              <li>містить шкідливі програми, спам або образливий матеріал;</li>
              <li>пропагує насильство, ненависть, дискримінацію або експлуатацію.</li>
            </ul>
          </>
        ),
      },
      {
        title: "9. Функції генеративного ШІ",
        content: (
          <>
            <p>9.1. Сервіс може включати інструменти генерації або покращення зображень з використанням штучного інтелекту.</p>
            <p>9.2. Всі вхідні дані (Input) та результати (Output) вважаються вашим Контентом.</p>
            <p>9.3. Забороняється використовувати функції ШІ для створення або розповсюдження:</p>
            <ul>
              <li>матеріалів сексуальної експлуатації дітей;</li>
              <li>відверто сексуального контенту;</li>
              <li>контенту, що пропагує насильство, ненависть або незаконну діяльність;</li>
              <li>спроб обходу механізмів безпеки ШІ.</li>
            </ul>
          </>
        ),
      },
      {
        title: "10. Захист даних",
        content: (
          <p>Вся інформація про захист персональних даних та конфіденційність доступна в нашій <Link href="/privacy" className="text-primary hover:underline">Політиці конфіденційності</Link> на сайті neurapix.net.</p>
        ),
      },
      {
        title: "11. Застосовне право та юрисдикція",
        content: (
          <p>Ці Умови регулюються та тлумачаться відповідно до принципів міжнародного комерційного права, якщо інше не передбачено імперативними нормами місцевого законодавства.</p>
        ),
      },
      {
        title: "12. Заключні положення",
        content: (
          <>
            <p>12.1. Якщо будь-яке положення цих Умов буде визнано недійсним або таким, що не підлягає виконанню, інші положення зберігають повну юридичну силу.</p>
            <p>12.2. Ми маємо право вносити зміни до цих Умов. Продовження використання Сервісу означає вашу згоду з оновленою редакцією.</p>
          </>
        ),
      },
    ],
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: January 2026",
    back: "Back",
    copyright: "© 2026 NeuraPix. All rights reserved.",
    sections: [
      {
        title: "1. Preamble",
        content: (
          <>
            <p>1.1. NeuraPix (hereinafter referred to as the "Operator", "we", "us" or "our") operates the website neurapix.net, which is an online platform providing image processing and enhancement services using artificial intelligence (hereinafter referred to as the "Service").</p>
            <p>1.2. These Terms of Service ("Terms") apply to all users of the neurapix.net website (hereinafter referred to as "User", "you" or "your"). By accessing or using the Service, you agree to comply with these Terms.</p>
          </>
        ),
      },
      {
        title: "2. Right of Use",
        content: (
          <>
            <h3>2.1. Access to the Platform</h3>
            <p>By using the Service, you agree that the Operator may temporarily store technical data such as IP addresses, device identifiers, and usage logs for security purposes, abuse prevention, performance monitoring, and Service quality improvement.</p>
            <h3>2.2. Your Content</h3>
            <h4>2.2.1. Content Definition</h4>
            <p>"Content" means any images, photographs, texts, files, data, or other materials that you upload, submit, process, generate, or otherwise use through the Service.</p>
            <p>We reserve the right (but are not obligated) to remove or restrict access to Content that violates these Terms or applicable law.</p>
            <h4>2.2.2. License to Your Content</h4>
            <p>Solely for the purpose of operating, supporting, and improving the Service, you grant the Operator a non-exclusive, perpetual, worldwide, royalty-free license with the right to sublicense to use, reproduce, modify, process, display, and distribute your Content within the Service.</p>
            <h4>2.2.3. Ownership</h4>
            <p>You retain full ownership of your Content. NeuraPix does not claim ownership of any Content uploaded or generated by you.</p>
            <h4>2.2.4. Content Deletion</h4>
            <p>If you delete Content from the Service, we will cease its active processing within a reasonable time. Backup copies may be temporarily retained for technical or legal reasons.</p>
          </>
        ),
      },
      {
        title: "3. User Obligations",
        content: (
          <>
            <p>3.1. The User agrees not to:</p>
            <ul>
              <li>interfere with the operation of the Service or its infrastructure;</li>
              <li>bypass security measures, request limits, or access control mechanisms;</li>
              <li>upload malware, harmful code, or exploit vulnerabilities;</li>
              <li>use automated systems exceeding reasonable usage limits.</li>
            </ul>
            <p>3.2. You are fully responsible for ensuring that your Content does not infringe copyrights, trademarks, privacy rights, or other rights of third parties.</p>
          </>
        ),
      },
      {
        title: "4. Warranties and Liability",
        content: (
          <>
            <p>4.1. The Service is provided "as is" and "as available" without any warranties, express or implied.</p>
            <p>4.2. We do not guarantee uninterrupted operation, processing speed, accuracy of results, or data preservation.</p>
            <p>4.3. To the maximum extent permitted by law, the Operator shall not be liable for indirect, incidental, or consequential damages.</p>
            <p>4.4. The Operator's total liability under these Terms shall in any case be limited to 100 (one hundred) euros.</p>
            <p>4.5. We may suspend or terminate your access to the Service at any time, with or without notice, in case of violation of the Terms or termination of the Service.</p>
          </>
        ),
      },
      {
        title: "5. Subscriptions and Payments",
        content: (
          <>
            <p>5.1. Some features of the Service may be provided on a paid basis. Subscriptions are automatically renewed unless cancelled before the end of the current billing period.</p>
            <p>5.2. Payments are non-refundable, except as expressly provided by applicable law.</p>
            <p>5.3. After cancelling a subscription, you retain access to paid features until the end of the current billing period.</p>
          </>
        ),
      },
      {
        title: "6. Account Deletion",
        content: (
          <>
            <p>You may request account deletion by contacting us at <a href="mailto:support@neurapix.net" className="text-primary hover:underline">support@neurapix.net</a>.</p>
            <p>Upon confirmed request, we will take reasonable steps to delete your personal data, subject to data retention requirements under applicable law.</p>
          </>
        ),
      },
      {
        title: "7. API Fair Use Policy",
        content: (
          <>
            <h3>7.1. API Access</h3>
            <p>Use of the NeuraPix API is subject to fair and reasonable use principles. API keys are personal and may not be transferred to third parties.</p>
            <h3>7.2. Prohibited API Use</h3>
            <p>The following is prohibited:</p>
            <ul>
              <li>abusing request limits;</li>
              <li>reverse engineering or reselling the API;</li>
              <li>using the API for illegal or malicious purposes.</li>
            </ul>
            <p>We reserve the right to suspend or revoke API access without prior notice in case of violations.</p>
          </>
        ),
      },
      {
        title: "8. Prohibited Use of Service",
        content: (
          <>
            <p>You agree not to use the Service to upload, generate, or distribute Content that:</p>
            <ul>
              <li>is illegal, fraudulent, or misleading;</li>
              <li>infringes intellectual property rights;</li>
              <li>contains malware, spam, or offensive material;</li>
              <li>promotes violence, hatred, discrimination, or exploitation.</li>
            </ul>
          </>
        ),
      },
      {
        title: "9. Generative AI Features",
        content: (
          <>
            <p>9.1. The Service may include tools for generating or enhancing images using artificial intelligence.</p>
            <p>9.2. All input data (Input) and results (Output) are considered your Content.</p>
            <p>9.3. It is prohibited to use AI features to create or distribute:</p>
            <ul>
              <li>child sexual exploitation material;</li>
              <li>explicitly sexual content;</li>
              <li>content promoting violence, hatred, or illegal activity;</li>
              <li>attempts to bypass AI safety mechanisms.</li>
            </ul>
          </>
        ),
      },
      {
        title: "10. Data Protection",
        content: (
          <p>All information about personal data protection and privacy is available in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> on neurapix.net.</p>
        ),
      },
      {
        title: "11. Applicable Law and Jurisdiction",
        content: (
          <p>These Terms are governed and interpreted in accordance with principles of international commercial law, unless otherwise provided by mandatory provisions of local law.</p>
        ),
      },
      {
        title: "12. Final Provisions",
        content: (
          <>
            <p>12.1. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
            <p>12.2. We reserve the right to amend these Terms. Continued use of the Service constitutes your acceptance of the updated version.</p>
          </>
        ),
      },
    ],
  },
};

export default function TermsPage() {
  const { language } = useI18n();
  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>

        <article className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground">
          <h1 className="text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.lastUpdated}</p>

          {t.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-foreground">{section.title}</h2>
              <div className="text-foreground [&>p]:text-foreground [&>h3]:text-foreground [&>h4]:text-foreground [&>ul]:text-foreground [&>li]:text-foreground">
                {section.content}
              </div>
            </section>
          ))}

          <p className="text-center mt-8 text-muted-foreground">{t.copyright}</p>
        </article>
      </div>
    </div>
  );
}
