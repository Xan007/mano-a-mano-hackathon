import { test, expect } from "@playwright/test";
import { SUPPORT_QUESTIONS } from "../../config/supportQuestions";

test("peluches responden las dudas de Apoyo sin pedir datos ni llamar automáticamente", async ({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/apoyo");
 const opener=page.getByRole("button",{name:/¿Te preocupa algo/});
 await expect(opener).toHaveAttribute("aria-expanded","false");
 await expect(page.locator('a[href="tel:123"]')).toHaveCount(0);
 await opener.click();
 await expect(opener).toHaveAttribute("aria-expanded","true");
 await expect(page.locator(".support-cast img")).toHaveCount(4);
 await expect(page.getByRole("region",{name:SUPPORT_QUESTIONS[0].question,exact:true})).toBeVisible();
 await page.locator(".support-questions").scrollIntoViewIfNeeded();
 await page.screenshot({path:`docs/hackathon/${info.project.name}-apoyo-peluches.png`});
 for(const topic of SUPPORT_QUESTIONS){
  const button=page.getByRole("button",{name:topic.question,exact:true});
  if(await button.getAttribute("aria-expanded")!=="true")await button.click();
  const answer=page.getByRole("region",{name:topic.question,exact:true});
  await expect(answer).toBeVisible();
  await expect(answer.locator(".support-speech")).toHaveCount(2);
  await expect(answer).toContainText(topic.replies[0]);
  await expect(answer).toContainText(topic.replies[1]);
 }
 await expect(page.locator('a[href="tel:123"]')).toHaveCount(1);
 await expect(page.locator(".support-questions input,.support-questions textarea")).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await opener.click();await expect(page.locator('a[href="tel:123"]')).toHaveCount(0);
 expect(errors).toEqual([]);
});
