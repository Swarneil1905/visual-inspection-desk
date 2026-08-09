#pragma once
#include <cstdint>
#ifdef _WIN32
#define QUALITY_API __declspec(dllexport)
#else
#define QUALITY_API __attribute__((visibility("default")))
#endif
// Input is tightly packed 8 bit RGB. Result ABI is two doubles.
struct QualityMetrics { double brightness; double sharpness; };
extern "C" QUALITY_API int image_quality(const uint8_t* rgb, int width, int height, int length, QualityMetrics* result);
