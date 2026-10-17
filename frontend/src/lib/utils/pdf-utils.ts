import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const downloadMealPlanAsPDF = async (elementId: string, dayNumber: number) => {
  const input = document.getElementById(elementId);
  if (!input) {
    toast.error("Could not find plan content.");
    return;
  }

  // Temporarily show the print-only summary block for capture
  const printOnlySummary = input.querySelector(".print-only-summary") as HTMLElement | null;
  if (printOnlySummary) {
    printOnlySummary.style.display = "block";
  }

  try {
    toast.info("Generating high-quality PDF — please wait...");

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#050505",
      logging: false,
      windowWidth: 1400,
      width: 1400,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          el.style.width = "1400px";
          el.style.padding = "40px";
          el.style.gap = "32px";
          el.style.display = "flex";
          el.style.flexDirection = "column";
        }
        // Make print-only section visible in the clone
        const printBlock = el?.querySelector(".print-only-summary") as HTMLElement | null;
        if (printBlock) {
          printBlock.style.display = "block";
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.85);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`mrdiet_Day${dayNumber}_Plan.pdf`);
    toast.success("PDF downloaded successfully!");
  } catch (error) {
    console.error("PDF Error:", error);
    toast.error("Failed to generate PDF");
  } finally {
    // Hide the print-only block again after capture
    if (printOnlySummary) {
      printOnlySummary.style.display = "none";
    }
  }
};
