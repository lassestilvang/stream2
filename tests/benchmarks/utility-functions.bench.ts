import { cn } from "@/lib/utils";

describe("Utility Functions Performance Benchmarks", () => {
  const runBenchmark = async (
    name: string,
    fn: () => void,
    iterations: number = 1000
  ) => {
    const times: number[] = [];
    const memoryUsages: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage
        ? process.memoryUsage().heapUsed
        : 0;

      fn();

      const endTime = performance.now();
      const endMemory = process.memoryUsage
        ? process.memoryUsage().heapUsed
        : 0;

      times.push(endTime - startTime);
      memoryUsages.push(endMemory - startMemory);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const avgMemory =
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const throughput = 1000 / avgTime; // operations per second

    console.log(
      `${name} - Average Time: ${avgTime.toFixed(
        4
      )}ms, Memory: ${avgMemory.toFixed(
        2
      )} bytes, Throughput: ${throughput.toFixed(2)} ops/sec`
    );

    // Baseline thresholds
    expect(avgTime).toBeLessThan(1); // Should be very fast, less than 1ms
    expect(avgMemory).toBeLessThan(10000); // Very low memory usage
  };

  describe("cn() function performance", () => {
    test("Single class string", async () => {
      await runBenchmark(
        "cn() - single class",
        () => {
          cn("bg-red-500");
        },
        10000
      );
    });

    test("Multiple class strings", async () => {
      await runBenchmark(
        "cn() - multiple strings",
        () => {
          cn("bg-red-500", "text-white", "p-4");
        },
        10000
      );
    });

    test("Array of classes", async () => {
      await runBenchmark(
        "cn() - array input",
        () => {
          cn(["bg-red-500", "text-white", "p-4"]);
        },
        10000
      );
    });

    test("Mixed inputs with conditional classes", async () => {
      const isActive = Math.random() > 0.5;
      const isDisabled = Math.random() > 0.5;

      await runBenchmark(
        "cn() - conditional classes",
        () => {
          cn(
            "base-class",
            isActive && "active-class",
            isDisabled && "disabled-class",
            "hover-class"
          );
        },
        10000
      );
    });

    test("Complex Tailwind classes", async () => {
      await runBenchmark(
        "cn() - complex Tailwind",
        () => {
          cn(
            "flex",
            "items-center",
            "justify-between",
            "px-4",
            "py-2",
            "bg-blue-500",
            "hover:bg-blue-600",
            "text-white",
            "font-medium",
            "rounded-lg",
            "shadow-md"
          );
        },
        10000
      );
    });

    test("Large number of classes (20)", async () => {
      const classes = Array.from({ length: 20 }, (_, i) => `class-${i}`);

      await runBenchmark(
        "cn() - 20 classes",
        () => {
          cn(...classes);
        },
        5000
      );
    });

    test("Classes with conflicting utilities", async () => {
      await runBenchmark(
        "cn() - conflicting utilities",
        () => {
          cn(
            "bg-red-500",
            "bg-blue-500", // This should override bg-red-500
            "text-white",
            "text-black" // This should override text-white
          );
        },
        10000
      );
    });

    test("Empty and undefined inputs", async () => {
      await runBenchmark(
        "cn() - empty/undefined inputs",
        () => {
          cn("base-class", undefined, null, "", "another-class");
        },
        10000
      );
    });
  });
});
